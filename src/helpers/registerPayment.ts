import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from '../payment/services/payment.service';
import { PaymentEntity } from '../payment/entity/payment.entity';
import { PaymentDTO } from '@/payment/dto/payment.dto';
import { PolicyEntity } from '@/policy/entities/policy.entity';

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

        // Verificar si ya se alcanzó el número máximo de pagos
        if (policy.payments.length >= policy.numberOfPayments) {
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

        // Verificar si ya se alcanzó el número máximo de pagos
        const currentPaymentsCount = policy.payments.length;
        if (currentPaymentsCount >= policy.numberOfPayments && payment.pending_value <= 0) {
          console.log(
            `Póliza ${policy.id} ya tiene todos sus pagos generados (${currentPaymentsCount}/${policy.numberOfPayments}).`,
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

        // Validar el estado de la póliza
        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) { // CANCELADA (2) o CULMINADA (3)
          console.log(
            `Póliza ${policy.numberPolicy} está CANCELADA o CULMINADA. No se generarán más pagos.`,
          );
          processedPolicies.add(payment.policy_id); // Marcar la póliza como procesada
          continue; // Saltar al siguiente pago
        }

        // Validar número máximo de pagos

        if (policy.payments.length >= policy.numberOfPayments && payment.pending_value <= 0) {
          console.log(
            `Póliza ${policy.numberPolicy} ya tiene todos sus pagos generados (${policy.payments.length}/${policy.numberOfPayments}).`,
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

  calculateNextPaymentDate(payment: PaymentEntity): Date | null {
    if (!payment.policies?.paymentFrequency) {
      return null;
    }

    const paymentFrequencyId = Number(payment.policies.paymentFrequency.id);
    const lastPaymentDate = new Date(payment.createdAt);

    if (isNaN(lastPaymentDate.getTime())) {
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
        return null;
    }

    return nextDate;
  }

  async createOverduePayment(payment: PaymentEntity, policy: PolicyEntity) {
    try {
      // Verificar el estado de la póliza
      if (policy.policy_status_id == 2 || policy.policy_status_id == 3) { // CANCELADA (2) o CULMINADA (3)
        console.log(
          `Póliza ${policy.id} está CANCELADA o CULMINADA. No se generarán más pagos.`,
        );
        return;
      }
      console.log(`Creando nuevo pago para el pago ID: ${payment.id}`);

      if (!policy.payments) {
        console.error('Error: No se encontraron pagos asociados a la póliza.');
        return;
      }

      if (payment.value <= 0 || payment.pending_value <= 0) {
        console.log(`No se creará un pago con valor ${payment.value} y saldo pendiente ${payment.pending_value}`);
        return;
      }

      const currentPolicyPayments = policy.payments.filter(
        p => p.policy_id === payment.policy_id
      );

      const maxNumberPayment = Math.max(
        ...currentPolicyPayments.map((p) => p.number_payment),
        0
      );

      // Validar número máximo de pagos
      if (maxNumberPayment >= policy.numberOfPayments && payment.pending_value <= 0) {
        console.log('Se ha alcanzado el número total de pagos permitidos. No se crearán más pagos.');
        return;
      }

      // Calcular nuevo saldo pendiente
      const lastPayment = currentPolicyPayments[currentPolicyPayments.length - 1];
      console.log('Último pago registrado:', lastPayment);
      // Si es el primer pago, el saldo pendiente es el valor total de la póliza menos el valor del pago
      let newPendingValue: number;
      if (maxNumberPayment === 0) {
        newPendingValue = Number(policy.policyValue) - Number(payment.value);
      } else {
        // Para los siguientes pagos, restar del saldo pendiente anterior
        newPendingValue = Number(lastPayment.pending_value) - Number(payment.value);
      }

      // Ajustar el valor del pago si el saldo pendiente es menor que el valor del pago
      if (newPendingValue < 0) {
        console.log('Ajustando el valor del último pago para evitar saldo negativo.');
        payment.value = Number(Number(lastPayment.pending_value).toFixed(2)); // Usar el saldo pendiente como valor del pago
        newPendingValue = 0; // El saldo pendiente será 0 después de este pago
      }

      console.log('Nuevo valor pendiente calculado:', newPendingValue);
      const createdAt = new Date(); // Fecha actual en UTC
      createdAt.setHours(createdAt.getHours() - 5); // Ajusta a UTC-5

      const newPayment: PaymentDTO = {
        policy_id: payment.policy_id,
        number_payment: maxNumberPayment + 1,
        value: payment.value,
        pending_value: Number(newPendingValue.toFixed(2)),
        credit: 0,
        balance: payment.value,
        total: 0,
        status_payment_id: 1,
        observations: '',
        createdAt: createdAt,
        //updatedAt: updatedAt
      };

      const savedPayment = await this.paymentService.createPayment(newPayment);
      //console.log('Nuevo pago creado:', savedPayment);

      return savedPayment;
    } catch (error) {
      console.error('Error al crear pago:', error);
      throw error;
    }
  }

}