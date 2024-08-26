import { IdEntity } from '@/config/id.entity';
import { IPayment } from '@/interface/all.Interfaces';
import { Column, Entity } from 'typeorm';
@Entity({ name: 'payment' })
export class PaymentMethodEntity extends IdEntity implements IPayment {
  @Column({ nullable: true })
  observations: string;
}
