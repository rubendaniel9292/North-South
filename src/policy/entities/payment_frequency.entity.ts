import { IdEntity } from '@/config/id.entity';
import { IPaymentFrequency } from '@/interface/all.Interfaces';
import { Column, Entity, OneToMany } from 'typeorm';
import { PolicyEntity } from './policy.entity';
@Entity({ name: 'payment_frequency' })
export class PaymentFrequencyEntity
  extends IdEntity
  implements IPaymentFrequency
{
  @Column({ unique: true })
  frequencyName: string;
  //una freciencia de pago puede estar asociada a muchas polizas
  @OneToMany(() => PolicyEntity, (policy) => policy.paymentFrequency)
  policies: PolicyEntity[];
}
