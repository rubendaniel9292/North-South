import { IdEntity } from '@/config/id.entity';
import { IPaymentFrequency } from '@/interface/all.Interfaces';
import { Column, Entity } from 'typeorm';
@Entity({ name: 'payment_frequency' })
export class PaymentFrequencyEntity
  extends IdEntity
  implements IPaymentFrequency
{
  @Column()
  frequencyName: string;
}
