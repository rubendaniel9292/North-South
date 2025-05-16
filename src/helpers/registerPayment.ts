import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from '../payment/services/payment.service';
import { PaymentEntity } from '../payment/entity/payment.entity';
import { PaymentDTO } from '@/payment/dto/payment.dto';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { DateHelper } from './date.helper';
@Injectable()
export class PaymentSchedulerService implements OnModuleInit {
  constructor(
    private readonly paymentService: PaymentService,
  ) { }

  async onModuleInit() {
    console.log('Inicializando módulo y verificando pagos pendientes...');

    try {
      // Solo verificamos si hay pagos pendientes sin procesar
      const payments = await this.paymentService.getAllPayments();

      if (payments.length === 0) {
        console.log('No hay pagos para procesar en la inicialización.');
        return;
      }
      console.log(`Se encontraron ${payments.length} pagos en el sistema.`);
      // Verificar si hay pagos que debieron generarse mientras el servidor estaba apagado
      const today = new Date();
      let pendingPayments = false;

      // Usamos un Set para evitar procesar la misma póliza múltiples veces
      const processedPolicies = new Set<number>();

      for (const payment of payments) {
        // Evitar procesar la misma póliza más de una vez
        if (processedPolicies.has(payment.policy_id)) {
          continue;
        }

        // Solo procesar pagos con saldo pendiente
        if (payment.pending_value <= 0) {
          continue;
        }

        const nextPaymentDate = this.calculateNextPaymentDate(payment);

        // Solo considerar pagos cuya fecha ya pasó
        if (nextPaymentDate && nextPaymentDate <= today) {
          pendingPayments = true;
          break; // Con encontrar uno es suficiente para saber que hay que procesar
        }
      }

      if (pendingPayments) {
        console.log('Se encontraron pagos pendientes que deben procesarse. Procesando...');
        // Llamamos a una versión modificada que solo procesa pagos vencidos
        await this.processOverduePaymentsOnly();
      } else {
        console.log('No hay pagos pendientes que procesar. Módulo inicializado correctamente.');
      }
    } catch (error) {
      console.error('Error al verificar pagos al inicializar el módulo:', error);
    }
  }

  // Método específico para procesar solo pagos vencidos sin duplicados
  async processOverduePaymentsOnly() {
    const today = new Date();
    console.log(`Procesando pagos vencidos desde ${today}`);

    const payments = await this.paymentService.getAllPayments();

    if (payments.length === 0) {
      return;
    }

    // Usamos un Set para evitar procesar la misma póliza múltiples veces
    const processedPolicies = new Set<number>();

    for (const payment of payments) {
      try {
        // Evitar procesar la misma póliza más de una vez
        if (processedPolicies.has(payment.policy_id)) {
          continue;
        }

        // Solo procesar pagos con saldo pendiente
        if (payment.pending_value <= 0) {
          continue;
        }

        const policy = await this.paymentService.getPolicyWithPayments(payment.policy_id);

        // Validar el estado de la póliza
        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
          processedPolicies.add(payment.policy_id);
          continue;
        }

        // Verificar si la póliza ha sido renovada
        const isRenewed = this.isPolicyRenewed(policy);

        // Si la póliza ha sido renovada, solo considerar los pagos después de la renovación
        let relevantPayments = policy.payments.filter(p => p.policy_id === payment.policy_id);
        console.log(`Procesando póliza ${policy.id} con ${relevantPayments.length} pagos relevantes.`);
        if (isRenewed) {
          const lastRenewalDate = this.getLastRenewalDate(policy);
          relevantPayments = relevantPayments.filter(
            p => DateHelper.normalizeDateForComparison(p.createdAt) >= lastRenewalDate
          );
        }



        // Verificar si ya se alcanzó el número máximo de pagos para este período
        if (relevantPayments.length >= policy.numberOfPayments) {
          processedPolicies.add(payment.policy_id);
          continue;
        }

        const nextPaymentDate = this.calculateNextPaymentDate(payment);

        // Solo crear pago si la fecha ya pasó
        if (nextPaymentDate && nextPaymentDate <= today) {
          console.log(`Procesando pago vencido para póliza ${policy.id}, fecha: ${nextPaymentDate}`);
          await this.createOverduePayment(payment, policy);
          processedPolicies.add(payment.policy_id);
        }
      } catch (error) {
        console.error(`Error procesando pago ${payment.id}:`, error);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    try {
      await this.verifyAndProcessPayments();
    } catch (error) {
      console.error(
        'Error al verificar y procesar pagos en el cron job:',
        error,
      );
    }
  }

  calculateNextPaymentDate(payment: PaymentEntity): Date | null {
    if (!payment.policies?.paymentFrequency || !payment.createdAt) {
      console.error(`No se puede calcular la próxima fecha de pago para el pago ID: ${payment.id}.`);
      return null;
    }

    const paymentFrequencyId = Number(payment.policies.paymentFrequency.id);
    //const lastPaymentDate = DateHelper.normalizeDateForDB(new Date(payment.createdAt));
    // Normalizar la fecha eliminando horas, minutos y segundos
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

  async createOverduePayment(payment: PaymentEntity, policy: PolicyEntity) {
    try {
      // Verificar el estado de la póliza
      if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
        console.log(`Póliza ${policy.id} está CANCELADA o CULMINADA. No se generarán más pagos.`);
        return;
      }

      console.log(`Creando nuevo pago para el pago ID: ${payment.id}`);
      if (!policy.payments) {
        console.error('Error: No se encontraron pagos asociados a la póliza.');
        return;
      }

      // Inicializar renovaciones si es undefined
      if (!policy.renewals) {
        policy.renewals = [];
      }

      if (payment.pending_value <= 0) {
        console.log(`No se creará un pago con valor ${payment.value} y saldo pendiente ${payment.pending_value}`);
        return;
      }

      // Verificar si la póliza ha sido renovada
      const isRenewed = this.isPolicyRenewed(policy);
      const hasRenewals = isRenewed && policy.renewals && policy.renewals.length > 0;

      console.log(`Renovaciones: ${policy.renewals.length}, Es renovada: ${isRenewed}`);
      console.log("Detalles de renovaciones:", {
        tieneRenovaciones: policy.renewals.length > 0,
        numeroRenovaciones: policy.renewals.length,
        esRenovada: isRenewed,
        ultimaRenovacion: hasRenewals ? policy.renewals[policy.renewals.length - 1] : null
      });

      // Filtrar pagos de la póliza actual
      let currentPolicyPayments = policy.payments.filter(p => p.policy_id === payment.policy_id);

      // Calcular el número máximo de pagos permitidos basado en renovaciones
      const totalPaymentsInCycle = Number(policy.numberOfPayments);

      // Calcular el número de ciclos completados basado en los pagos existentes
      const completedCycles = Math.floor(currentPolicyPayments.length / totalPaymentsInCycle);

      // Verificar si el número de ciclos completados es mayor que el número de renovaciones
      if (completedCycles > policy.renewals.length) {
        console.log(`Se han completado ${completedCycles} ciclos de pago, pero solo hay ${policy.renewals.length} renovaciones.`);
        console.log(`No se pueden crear más pagos hasta que se renueve la póliza.`);
        return;
      }

      // Calcular el número máximo de pagos permitidos en el ciclo actual
      const maxAllowedPayments = totalPaymentsInCycle * (policy.renewals.length + 1);

      console.log(`Ciclos completados: ${completedCycles}, Renovaciones: ${policy.renewals.length}`);
      console.log(`Pagos máximos permitidos: ${maxAllowedPayments}, Pagos actuales: ${currentPolicyPayments.length}`);

      // Verificar si ya se alcanzó el número máximo de pagos para el ciclo actual
      if (currentPolicyPayments.length >= maxAllowedPayments) {
        console.log(`Se ha alcanzado el número máximo de pagos permitidos (${currentPolicyPayments.length}/${maxAllowedPayments}).`);
        console.log(`No se crearán más pagos hasta que se renueve la póliza.`);
        return;
      }

      // Calcular el siguiente número de pago
      const maxNumberPayment = Math.max(
        ...currentPolicyPayments.map((p) => p.number_payment),
        0
      );
      const nextPaymentNumber = maxNumberPayment + 1;

      // Verificar si ya existe un pago con este número
      const existingPayment = currentPolicyPayments.find(p => p.number_payment === nextPaymentNumber);
      if (existingPayment) {
        console.log(`Ya existe un pago con número ${nextPaymentNumber} para la póliza ${policy.id}. No se generará un pago duplicado.`);
        return;
      }

      // Calcular el valor del pago
      const valueToPay = Number(policy.policyValue) / totalPaymentsInCycle;

      // Calcular nuevo saldo pendiente
      let newPendingValue: number;

      // Calcular si es el último pago del ciclo actual
      const isLastPaymentInCycle = (nextPaymentNumber % totalPaymentsInCycle === 0);

      if (isLastPaymentInCycle) {
        // Si es el último pago del ciclo, el pendiente debe ser 0
        newPendingValue = 0;
      } else {
        // Para los demás pagos, calcular basado en la posición dentro del ciclo
        const positionInCycle = nextPaymentNumber % totalPaymentsInCycle || totalPaymentsInCycle;
        const remainingPaymentsInCycle = totalPaymentsInCycle - positionInCycle;
        newPendingValue = remainingPaymentsInCycle * valueToPay;
      }

      if (newPendingValue < 0) newPendingValue = 0;

      // Crear el nuevo pago
      const createdAt = DateHelper.normalizeDateForComparison(new Date());
      const newPayment: PaymentDTO = {
        policy_id: payment.policy_id,
        number_payment: nextPaymentNumber,
        value: valueToPay,
        pending_value: Number(newPendingValue.toFixed(2)),
        credit: 0,
        balance: valueToPay,
        total: 0,
        status_payment_id: 1,
        observations: '',
        createdAt: createdAt,
      };

      const savedPayment = await this.paymentService.createPayment(newPayment);
      return savedPayment;
    } catch (error) {
      console.error('Error al crear pago:', error);
      throw error;
    }
  }
  async manualProcessPayments() {
    console.log('Iniciando procesamiento manual de pagos...');
    try {

      const payments = await this.paymentService.getAllPayments();

      if (payments.length === 0) {
        console.log('No hay pagos para procesar.');
        return { message: 'No hay pagos para procesar.' };
      }
      const createdPayments = []; // Almacenar pagos creados
      const processedPolicies = new Set<number>(); // Registrar pólizas procesadas

      for (const payment of payments) {
        // Verificar si la póliza ya ha sido procesada
        if (processedPolicies.has(payment.policy_id)) {
          continue; // Saltar si la póliza ya fue procesada
        }

        const policy = await this.paymentService.getPolicyWithPayments(
          payment.policy_id,
        );
        // Al recibir la póliza de la base de datos
        if (!policy.renewals) {
          policy.renewals = []; // Inicializar como array vacío si es undefined
        }
        console.log(`Poliza ${policy.numberPolicy} tiene ${policy.payments.length} pagos generados.`)
        console.log(
          `Procesando pago ${payment.id} para póliza ${policy.numberPolicy}.`,
        );

        // Validar el estado de la póliza
        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) { // CANCELADA (2) o CULMINADA (3)
          console.log(
            `Póliza ${policy.numberPolicy} está CANCELADA o CULMINADA. No se generarán más pagos.`,
          );
          processedPolicies.add(payment.policy_id); // Marcar la póliza como procesada
          continue; // Saltar al siguiente pago
        }
        console.log("numeros de pagos al momento de la prueba manual: ", policy.numberOfPayments)
        console.log("renovaciones: ", policy.renewals && policy.renewals.length);
        console.log("pagos generados: ", policy.payments.length)
        console.log("pagos generados: ", policy.payments.length)
 

        // Verificar si la póliza ha sido renovada
        const isRenewed = this.isPolicyRenewed(policy);
        console.log(`Renovaciones: ${policy.renewals ? policy.renewals.length : 0}, Es renovada: ${isRenewed}`);
        console.log("Detalles de renovaciones:", {
          tieneRenovaciones: policy.renewals ? true : false,
          numeroRenovaciones: policy.renewals ? policy.renewals.length : 0,
          esRenovada: isRenewed,
          ultimaRenovacion: policy.renewals && policy.renewals.length > 0 ?
            policy.renewals[policy.renewals.length - 1] : null
        });
        let maxAllowedPayments = policy.numberOfPayments;

        // Si hay renovaciones, calcular el número máximo de pagos permitidos

        if (isRenewed && policy.renewals && policy.renewals.length > 0) {
          // Cada renovación permite un nuevo ciclo completo de pagos
          maxAllowedPayments = policy.numberOfPayments * (policy.renewals.length + 1);
          console.log(`Póliza renovada ${policy.renewals.length} veces. Pagos máximos permitidos: ${maxAllowedPayments}`);
        }

        // Validar número máximo de pagos (considerando renovaciones)
        if (policy.payments.length >= maxAllowedPayments && payment.pending_value <= 0) {
          console.log(
            `Póliza ${policy.numberPolicy} ya tiene todos sus pagos generados (${policy.payments.length}/${maxAllowedPayments}).`,
          );
          processedPolicies.add(payment.policy_id); // Marcar la póliza como procesada
          continue;
        }


        // Crear pago si hay saldo pendiente
        if (payment.pending_value > 0) {
          const newPayment = await this.createOverduePayment(payment, policy);
          createdPayments.push(newPayment);
          processedPolicies.add(payment.policy_id); // Marcar la póliza como procesada
        }
      }
      console.log('Procesamiento manual completado!!...');
      return { createdPayments }; // Devolver pagos creados
    } catch (error) {
      console.error('Error en el procesamiento manual:', error);
      throw error;
    }
  }

  async verifyAndProcessPayments() {
    const today = new Date();
    const payments = await this.paymentService.getAllPayments();
    //cost policy = await this.po
    if (payments.length === 0) {
      console.log('No hay pagos para procesar.');
      return;
    }
    // Usamos un Set para evitar procesar la misma póliza múltiples veces
    const processedPolicies = new Set<number>();
    for (const payment of payments) {
      try {
        // Evitar procesar la misma póliza más de una vez
        if (processedPolicies.has(payment.policy_id)) {
          continue;
        }

        // Solo procesar pagos con saldo pendiente
        if (payment.pending_value <= 0) {
          continue;
        }
        // Obtener la póliza actualizada con todos sus pagos
        const policy = await this.paymentService.getPolicyWithPayments(
          payment.policy_id,
        );
        // Al recibir la póliza de la base de datos
        if (!policy.renewals) {
          policy.renewals = []; // Inicializar como array vacío si es undefined
        }
        console.log(`Procesando póliza ${policy.id}...`);
        console.log(`Pagos actuales: ${policy.payments.length}/${policy.numberOfPayments}`);
        console.log(`Saldo pendiente: ${payment.pending_value}`);

        //console.log("Poliza obtenida antes de la valdiacion: ", policy)
        // Validar el estado de la póliza

        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) { // CANCELADA (2) o CULMINADA (3)
          console.log(
            `Póliza ${policy.id} está CANCELADA o CULMINADA. No se generarán más pagos.`,
          );
          console.log(
            `estado de esta poliza: ${policy.policy_status_id}` && typeof policy.policy_status_id,
          );
          continue; // Saltar al siguiente pago
        }

        // Verificar si la póliza ha sido renovada
        const isRenewed = this.isPolicyRenewed(policy);
        console.log(`Renovaciones: ${policy.renewals ? policy.renewals.length : 0}, Es renovada: ${isRenewed}`);
        let maxAllowedPayments = policy.numberOfPayments;
        console.log("numeros de pagos al momento de la de la verificacion: ", policy.numberOfPayments)
        console.log("renovaciones: ", policy.renewals && policy.renewals.length > 0)
        console.log(`Renovaciones: ${policy.renewals ? policy.renewals.length : 0}, Es renovada: ${isRenewed}`);
        console.log("Detalles de renovaciones:", {
          tieneRenovaciones: policy.renewals.length > 0 ? true : false,
          numeroRenovaciones: policy.renewals.length > 0 ? policy.renewals.length : 0,
          esRenovada: isRenewed,
          ultimaRenovacion: policy.renewals && policy.renewals.length > 0 ?
            policy.renewals[policy.renewals.length - 1] : null
        });
        console.log("pagos generados: ", policy.payments.length)

        // Verificar si ya se alcanzó el número máximo de pagos (considerando renovaciones)
        const currentPaymentsCount = policy.payments.length;
        if (currentPaymentsCount >= maxAllowedPayments && payment.pending_value <= 0) {
          console.log(
            `Póliza ${policy.id} ya tiene todos sus pagos generados (${currentPaymentsCount}/${maxAllowedPayments}).`,
          );
          continue;
        }
        const nextPaymentDate = this.calculateNextPaymentDate(payment);
        console.log(
          `Pago ID: ${payment.id}, Próxima Fecha de Pago: ${nextPaymentDate}, Hoy: ${today}`,
        );

        if (nextPaymentDate && nextPaymentDate <= today) {
          await this.createOverduePayment(payment, policy);
        }
      } catch (error) {
        console.error(`Error procesando pago ${payment.id}:`, error);
        continue;
      }
    }
  }
  // Método para verificar si una póliza ha sido renovada
  isPolicyRenewed(policy: PolicyEntity): boolean {
    if (!policy.renewals || policy.renewals.length === 0) {
      console.log(`La póliza ${policy.id} no tiene renovaciones.`);
      return false;
    }

    console.log(`La póliza ${policy.id} tiene ${policy.renewals.length} renovaciones.`);
    return true;
  }

  getLastRenewalDate(policy: PolicyEntity): Date {
    if (!policy.renewals || policy.renewals.length === 0) {
      return new Date(policy.startDate);
    }

    // Ordenar explícitamente las renovaciones por fecha
    const sortedRenewals = [...policy.renewals].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const lastRenewal = sortedRenewals[0];
    console.log(`Última renovación fecha: ${new Date(lastRenewal.createdAt)}`);

    return new Date(lastRenewal.createdAt);
  }
}
