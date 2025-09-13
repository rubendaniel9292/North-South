import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from '../payment/services/payment.service';
import { PaymentEntity } from '../payment/entity/payment.entity';
import { PaymentDTO } from '@/payment/dto/payment.dto';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { DateHelper } from './date.helper';

@Injectable()
export class PaymentSchedulerService implements OnModuleInit {
  constructor(private readonly paymentService: PaymentService) { }

  /**
   * Función optimizada para verificar si hay pagos pendientes sin cargar todos los pagos en memoria
   * Esta función reemplaza el uso de getAllPayments() en onModuleInit para evitar memory leak
   * 
   * Implementación optimizada que:
   * 1. Usa COUNT en lugar de SELECT *
   * 2. Solo verifica pagos con pending_value > 0
   * 3. No carga relaciones innecesarias
   * 4. Retorna boolean directamente
   * 
   * @returns Promise<boolean> - true si hay pagos pendientes, false si no
   */
  private async checkIfPendingPaymentsExist(): Promise<boolean> {
    try {
      // Usar el método optimizado del PaymentService
      return await this.paymentService.checkPendingPaymentsExist();
    } catch (error) {
      console.error('Error al verificar pagos pendientes:', error);
      // En caso de error, devolver false para no bloquear la inicialización
      return false;
    }
  }

  async onModuleInit() {
    console.log('Inicializando módulo y verificando pagos pendientes...');
    try {
      // OPTIMIZACIÓN: Usar función que no carga todos los pagos en memoria
      const hasPendingPayments = await this.checkIfPendingPaymentsExist();
      
      if (hasPendingPayments) {
        console.log('Se encontraron pagos pendientes que deben procesarse. Procesando...');
        await this.processOverduePaymentsOnly();
      } else {
        console.log('No hay pagos pendientes que procesar. Módulo inicializado correctamente.');
      }
    } catch (error) {
      console.error('Error al verificar pagos al inicializar el módulo:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    try {
      await this.verifyAndProcessPayments();
    } catch (error) {
      console.error('Error al verificar y procesar pagos en el cron job:', error);
    }
  }

  // PROCESA SOLO PAGOS VENCIDOS (evita duplicados por fecha)
  async processOverduePaymentsOnly() {
    const today = new Date();
    console.log(`Procesando pagos vencidos desde ${today.toLocaleDateString('es-EC')}`);
    const payments = await this.paymentService.getAllPayments();
    if (payments.length === 0) {
      console.log('No hay pagos para procesar.');
      return;
    }

    const processedPolicies = new Set<number>();
    let totalProcessed = 0;
    let paymentsCreated = 0;
    let skippedPolicies = 0;

    for (const payment of payments) {
      try {
        if (processedPolicies.has(payment.policy_id)) continue;
        if (payment.pending_value <= 0) continue;
        
        const policy = await this.paymentService.getPolicyWithPayments(payment.policy_id);
        
        // Marcar como procesada inmediatamente para evitar logs duplicados
        processedPolicies.add(payment.policy_id);
        totalProcessed++;
        
        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
          skippedPolicies++;
          continue;
        }
        
        const isRenewed = this.isPolicyRenewed(policy);
        let relevantPayments = policy.payments.filter(p => p.policy_id === payment.policy_id);
        if (isRenewed) {
          const lastRenewalDate = this.getLastRenewalDate(policy);
          relevantPayments = relevantPayments.filter(
            p => DateHelper.normalizeDateForComparison(p.createdAt) >= lastRenewalDate
          );
        }
        if (relevantPayments.length >= policy.numberOfPayments) {
          continue;
        }
        
        const nextPaymentDate = this.calculateNextPaymentDate(payment);
        const todayNorm = DateHelper.normalizeDateForComparison(today);
        const nextPaymentDateNorm = DateHelper.normalizeDateForComparison(nextPaymentDate);

        // SOLO crear pago si la fecha del próximo pago es HOY exactamente
        if (nextPaymentDateNorm.getTime() === todayNorm.getTime()) {
          const createdPayment = await this.createOverduePayment(payment, policy, nextPaymentDateNorm);
          if (createdPayment) {
            paymentsCreated++;
          }
        }
      } catch (error) {
        console.error(`Error procesando pago ${payment.id}:`, error);
      }
    }
    
    // Resumen consolidado
    console.log(`✅ Procesamiento completado: ${totalProcessed} pólizas procesadas, ${paymentsCreated} pagos creados, ${skippedPolicies} pólizas omitidas (canceladas/culminadas)`);
  }

  async verifyAndProcessPayments() {
    const today = new Date();
    const payments = await this.paymentService.getAllPayments();
    if (payments.length === 0) {
      console.log('No hay pagos para procesar.');
      return;
    }
    
    const processedPolicies = new Set<number>();
    let totalProcessed = 0;
    let paymentsCreated = 0;
    
    for (const payment of payments) {
      try {
        if (processedPolicies.has(payment.policy_id)) continue;
        if (payment.pending_value <= 0) continue;
        
        const policy = await this.paymentService.getPolicyWithPayments(payment.policy_id);
        processedPolicies.add(payment.policy_id);
        totalProcessed++;
        
        if (!policy.renewals) policy.renewals = [];
        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) continue;
        
        const isRenewed = this.isPolicyRenewed(policy);
        let maxAllowedPayments = policy.numberOfPayments;
        if (isRenewed && policy.renewals && policy.renewals.length > 0) {
          maxAllowedPayments = policy.numberOfPayments * (policy.renewals.length + 1);
        }
        const currentPaymentsCount = policy.payments.length;
        if (currentPaymentsCount >= maxAllowedPayments && payment.pending_value <= 0) continue;
        
        const nextPaymentDate = this.calculateNextPaymentDate(payment);
        const todayNorm = DateHelper.normalizeDateForComparison(today);
        const nextPaymentDateNorm = DateHelper.normalizeDateForComparison(nextPaymentDate);

        // SOLO crear pago si la fecha del próximo pago es HOY exactamente
        if (nextPaymentDateNorm.getTime() === todayNorm.getTime()) {
          const createdPayment = await this.createOverduePayment(payment, policy, nextPaymentDateNorm);
          if (createdPayment) {
            paymentsCreated++;
          }
        }
      } catch (error) {
        console.error(`Error procesando pago ${payment.id}:`, error);
        continue;
      }
    }
    
    // Resumen consolidado solo si se procesó algo
    if (totalProcessed > 0) {
      console.log(`✅ Verificación diaria completada: ${totalProcessed} pólizas verificadas, ${paymentsCreated} pagos creados`);
    }
  }

  // Método para crear un pago solo si NO existe pago para esa fecha
  async createOverduePayment(payment: PaymentEntity, policy: PolicyEntity, paymentDueDate: Date, observationText?: string): Promise<PaymentEntity | null> {
    try {
      if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
        return null;
      }
      if (!policy.payments) {
        console.error('Error: No se encontraron pagos asociados a la póliza.');
        return null;
      }
      if (!policy.renewals) policy.renewals = [];
      if (payment.pending_value <= 0) {
        return null;
      }

      // Validar que NO exista un pago en esa fecha
      const alreadyExistsForDate = policy.payments.some(p =>
        DateHelper.normalizeDateForComparison(p.createdAt).getTime() === paymentDueDate.getTime()
      );
      if (alreadyExistsForDate) {
        return null;
      }

      // Calcular el siguiente número de pago
      let currentPolicyPayments = policy.payments.filter(p => p.policy_id === payment.policy_id);
      const totalPaymentsInCycle = Number(policy.numberOfPayments);
      const maxNumberPayment = Math.max(
        ...currentPolicyPayments.map((p) => p.number_payment),
        0
      );
      const nextPaymentNumber = maxNumberPayment + 1;

      // Chequeo extra por número de pago (defensivo)
      const existingPayment = currentPolicyPayments.find(p => p.number_payment === nextPaymentNumber);
      if (existingPayment) {
        return null;
      }

      // Calcular valor del pago y saldo pendiente
      const valueToPay = Number(policy.policyValue) / totalPaymentsInCycle;
      let newPendingValue: number;
      const isLastPaymentInCycle = (nextPaymentNumber % totalPaymentsInCycle === 0);
      if (isLastPaymentInCycle) {
        newPendingValue = 0;
      } else {
        const positionInCycle = nextPaymentNumber % totalPaymentsInCycle || totalPaymentsInCycle;
        const remainingPaymentsInCycle = totalPaymentsInCycle - positionInCycle;
        newPendingValue = remainingPaymentsInCycle * valueToPay;
      }
      if (newPendingValue < 0) newPendingValue = 0;

      const newPayment: PaymentDTO = {
        policy_id: payment.policy_id,
        number_payment: nextPaymentNumber,
        value: valueToPay,
        pending_value: Number(newPendingValue.toFixed(2)),
        credit: 0,
        balance: valueToPay,
        total: 0,
        status_payment_id: 1,
        observations: observationText || 'Pago generado automáticamente según la fecha de pago',
        createdAt: paymentDueDate, // fecha de vencimiento, NO la actual
      };

      const savedPayment = await this.paymentService.createPayment(newPayment);
      return savedPayment;
    } catch (error) {
      console.error('Error al crear pago:', error);
      throw error;
    }
  }

  // Cálculo de próxima fecha de pago
  calculateNextPaymentDate(payment: PaymentEntity): Date | null {
    if (!payment.policies?.paymentFrequency || !payment.createdAt) {
      console.error(`No se puede calcular la próxima fecha de pago para el pago ID: ${payment.id}.`);
      return null;
    }
    const paymentFrequencyId = Number(payment.policies.paymentFrequency.id);
    const lastPaymentDate = DateHelper.normalizeDateForComparison(new Date(payment.createdAt));
    if (isNaN(lastPaymentDate.getTime())) {
      console.error(`Fecha de último pago inválida para el pago ID: ${payment.id}.`);
      return null;
    }
    const nextDate = new Date(lastPaymentDate);
    switch (paymentFrequencyId) {
      case 1: // Mensual
      case 5: // Otro pago (Mensual)
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 2: // Trimestral
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 3: // Semestral
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 4: // Anual
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        console.error(`Frecuencia de pago no válida para el pago ID: ${payment.id}.`);
        return null;
    }
    return nextDate;
  }

  // Métodos auxiliares igual que en tu código original
  isPolicyRenewed(policy: PolicyEntity): boolean {
    if (!policy.renewals || policy.renewals.length === 0) {
      return false;
    }
    return true;
  }

  getLastRenewalDate(policy: PolicyEntity): Date {
    if (!policy.renewals || policy.renewals.length === 0) {
      return new Date(policy.startDate);
    }
    const sortedRenewals = [...policy.renewals].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastRenewal = sortedRenewals[0];
    return new Date(lastRenewal.createdAt);
  }

  // Manual para pruebas (no requiere ajuste de lógica, pero debe pasar paymentDueDate correcto)
  async manualProcessPayments() {
    console.log('Iniciando procesamiento manual de pagos...');
    try {
      const payments = await this.paymentService.getAllPayments();
      if (payments.length === 0) {
        console.log('No hay pagos para procesar.');
        return { message: 'No hay pagos para procesar.' };
      }
      const createdPayments = [];
      const processedPolicies = new Set<number>();
      for (const payment of payments) {
        if (processedPolicies.has(payment.policy_id)) continue;
        const policy = await this.paymentService.getPolicyWithPayments(payment.policy_id);
        if (!policy.renewals) policy.renewals = [];
        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
          processedPolicies.add(payment.policy_id);
          continue;
        }
        const nextPaymentDate = this.calculateNextPaymentDate(payment);
        const nextPaymentDateNorm = DateHelper.normalizeDateForComparison(nextPaymentDate);
        const newPayment = await this.createOverduePayment(payment, policy, nextPaymentDateNorm, 'Pago generado de manera manual');
        if (newPayment) createdPayments.push(newPayment);
        processedPolicies.add(payment.policy_id);
      }
      console.log('Procesamiento manual completado!!...');
      return { createdPayments };
    } catch (error) {
      console.error('Error en el procesamiento manual:', error);
      throw error;
    }
  }
}