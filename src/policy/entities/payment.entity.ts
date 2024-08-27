import { IdEntity } from '@/config/id.entity';
import { IPayment } from '@/interface/all.Interfaces';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { PaymentMethodEntity } from './payment_method.entity';
import { BankEntity } from '@/creditcard/entities/bank.entity';
@Entity({ name: 'payment' })
export class PaymentEntity extends IdEntity implements IPayment {
  @Column({ nullable: true })
  observations: string;
  /*
  Un método de pago (payment_method) puede estar asociado con múltiples registros de pagos (payment), 
  pero cada registro de pago se asocia con un solo método de pago.*/

  @ManyToOne(
    () => PaymentMethodEntity,
    (paymentmethod) => paymentmethod.payment,
    {
      onDelete: 'RESTRICT', // No permite la eliminación en cascada
    },
  )
  @JoinColumn({ name: 'payment_method_id' })
  paymentmethod: PaymentMethodEntity; //relacion

  @ManyToOne(() => BankEntity, { nullable: true }) // Relación opcional con `bank`
  @JoinColumn({ name: 'bank_id' })
  bank: BankEntity;
}
