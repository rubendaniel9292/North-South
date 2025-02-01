import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from '../payment/services/payment.service';
import { PaymentEntity } from '../payment/entity/payment.entity';
import { PaymentDTO } from '@/payment/dto/payment.dto';

@Injectable()
export class PaymentSchedulerService implements OnModuleInit {
  constructor(private readonly paymentService: PaymentService) { }

  async onModuleInit() {
    console.log(
      'Inicializando módulo y verificando próximas fechas de pago...',
    );
    try {
      await this.verifyAndProcessPayments();
    } catch (error) {
      console.error(
        'Error al verificar y procesar pagos al inicializar el módulo:',
        error,
      );
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

    if (payments.length === 0) {
      console.log('No hay pagos para procesar.');
      return;
    }

    for (const payment of payments) {
      try {
        // Obtener la póliza actualizada con todos sus pagos
        const policy = await this.paymentService.getPolicyWithPayments(
          payment.policy_id,
        );

        // Verificar si ya se alcanzó el número máximo de pagos
        const currentPaymentsCount = policy.payments.length;
        if (currentPaymentsCount >= policy.numberOfPayments) {
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
          await this.createOverduePayment(payment);
          //break; // Salir del bucle después de crear un pago
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

      for (const payment of payments) {
        const policy = await this.paymentService.getPolicyWithPayments(
          payment.policy_id,
        );

        // Validar número máximo de pagos
        if (policy.payments.length >= policy.numberOfPayments) {
          console.log(
            `Póliza ${policy.id} ya tiene todos sus pagos generados (${policy.payments.length}/${policy.numberOfPayments}).`,
          );
          continue;
        }

        // Crear pago si hay saldo pendiente
        if (payment.pending_value > 0) {
          const newPayment = await this.createOverduePayment(payment);
          createdPayments.push(newPayment);
          break; // Salir del bucle después de crear un pago
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

  async createOverduePayment(payment: PaymentEntity) {
    try {
      console.log(`Creando nuevo pago para el pago ID: ${payment.id}`);

      if (!payment.policies || !payment.policies.payments) {
        console.error('Error: No se encontraron políticas o pagos asociados a la póliza.');
        return;
      }

      const currentPolicyPayments = payment.policies.payments.filter(
        p => p.policy_id === payment.policy_id
      );

      const maxNumberPayment = Math.max(
        ...currentPolicyPayments.map((p) => p.number_payment),
        0
      );

      // Validar número máximo de pagos
      if (maxNumberPayment >= payment.policies.numberOfPayments) {
        console.log('Se ha alcanzado el número total de pagos permitidos. No se crearán más pagos.');
        return;
      }

      // Calcular nuevo saldo pendiente
      const lastPayment = currentPolicyPayments[currentPolicyPayments.length - 1];
      //const newPendingValue = lastPayment.pending_value - lastPayment.value;
      const newPendingValue = lastPayment.pending_value;
      if (newPendingValue < 0) {
        console.log('El valor pendiente no puede ser negativo. No se crearán más pagos.');
        return;
      }
      /*
            const newPayment: PaymentDTO = {
              policy_id: payment.policy_id,
              number_payment: maxNumberPayment + 1,
              pending_value: newPendingValue >= 0 ? newPendingValue : 0,
              value: payment.value,
              credit: 0,
              balance: payment.balance,
              total: 0,
              status_payment_id: 1, // Estado por defecto (ej: "Pendiente")
              createdAt: new Date(),
              updatedAt: new Date(),
            };*/
      /*
      const newPayment: PaymentDTO = {
        policy_id: payment.policy_id,
        number_payment: maxNumberPayment + 1, // Este valor será actualizado en createPayment
        value: payment.value,
        pending_value: newPendingValue >= 0 ? newPendingValue : 0,
        status_payment_id: 1,
        credit: 0,
        balance: payment.balance,
        total: 0,
        observations: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };*/

      const newPayment: PaymentDTO = {
        policy_id: payment.policy_id,
        number_payment: maxNumberPayment + 1,
        pending_value: newPendingValue >= 0 ? newPendingValue : 0,
        value: payment.value,
        credit: 0,
        balance: payment.value,
        total: 0,
        status_payment_id: 1, // Estado por defecto (ej: "Pendiente")
        observations: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedPayment = await this.paymentService.createPayment(newPayment);
      console.log('Nuevo pago creado:', savedPayment);

      // Verificar si se completaron todos los pagos
      if (newPendingValue <= 0 && newPayment.number_payment >= payment.policies.numberOfPayments) {
        console.log(`Todos los pagos para la póliza ${payment.policy_id} han sido completados.`);
      }

      return savedPayment;
    } catch (error) {
      console.error('Error al crear pago:', error);
      throw error;
    }
  }
}