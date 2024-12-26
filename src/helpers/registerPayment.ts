import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from '../payment/services/payment.service';
import { PaymentEntity } from '../payment/entity/payment.entity';

@Injectable()
export class PaymentSchedulerService {
  constructor(private readonly paymentService: PaymentService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    const today = new Date();
    const payments = await this.paymentService.getAllPayments();

    for (const payment of payments) {
      const nextPaymentDate = this.calculateNextPaymentDate(payment);
      if (nextPaymentDate && nextPaymentDate <= today) {
        await this.createOverduePayment(payment);
      }
    }
  }

  calculateNextPaymentDate(payment: PaymentEntity): Date | null {
    const { paymentFrequency } = payment.policies;
    const lastPaymentDate = payment.createdAt;

    if (lastPaymentDate) {
      const nextDate = new Date(lastPaymentDate);
      switch (paymentFrequency.id) {
        case 1: // Mensual
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
    return null;
  }

  async createOverduePayment(payment: PaymentEntity) {
    const newPayment = new PaymentEntity();
    newPayment.policy_id = payment.policy_id;
    newPayment.number_payment = payment.number_payment + 1;
    newPayment.pending_value = payment.pending_value;
    newPayment.value = payment.value;
    newPayment.credit = payment.credit;
    newPayment.balance = payment.balance;
    newPayment.total = payment.total;
    newPayment.createdAt = new Date();

    await this.paymentService.createPayment(newPayment);
  }
}
