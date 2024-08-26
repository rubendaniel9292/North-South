import { IdEntity } from '@/config/id.entity';
import { IPaymentMethod } from '@/interface/all.Interfaces';
import { Column, Entity } from 'typeorm';
@Entity({ name: 'payment_method' })
export class PaymentMethodEntity extends IdEntity implements IPaymentMethod {
  @Column()
  methodName: string;
}
