import { Entity, Column, OneToMany } from 'typeorm';
import { IdEntity } from '@/config/id.entity';
import { PaymentEntity } from './payment.entity';
@Entity('payment_status')
export class PaymentStatusEntity extends IdEntity {
  @Column()
  statusNamePayment: string;
  @OneToMany(() => PaymentEntity, (payment) => payment.paymentStatus)
  payments: PaymentEntity[];
}
