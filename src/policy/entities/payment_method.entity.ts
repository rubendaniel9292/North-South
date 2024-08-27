import { IdEntity } from '@/config/id.entity';
import { IPaymentMethod } from '@/interface/all.Interfaces';
import { Column, Entity, OneToMany } from 'typeorm';
import { PaymentEntity } from './payment.entity';

@Entity({ name: 'payment_method' })
export class PaymentMethodEntity extends IdEntity implements IPaymentMethod {
  @Column({ unique: true })
  methodName: string;

  @OneToMany(() => PaymentEntity, (payment) => payment.paymentmethod)
  payment: PaymentEntity[];
}
