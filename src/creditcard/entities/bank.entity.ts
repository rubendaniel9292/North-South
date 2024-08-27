import {
  Column,
  //CreateDateColumn,
  Entity,
  OneToMany,
  // JoinColumn,
  //ManyToOne,
} from 'typeorm';
import { CreditCardEntity } from './credit.card.entity';
import { IBank } from '@/interface/all.Interfaces';
import { IdEntity } from '@/config/id.entity';
import { PaymentEntity } from '@/policy/entities/payment.entity';

@Entity({ name: 'bank' })
export class BankEntity extends IdEntity implements IBank {
  @Column({ unique: true })
  bankName: string;

  // Relación uno a varios: un banco emite muchas tarjetas
  @OneToMany(() => CreditCardEntity, (creditcard) => creditcard.bank, {
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  creditcard: CreditCardEntity[];

  @OneToMany(() => PaymentEntity, (paymentmethod) => paymentmethod.bank, {
    nullable: true, // Si la relación no es obligatoria
    onDelete: 'RESTRICT', // Otras opciones pueden ser consideradas dependiendo del caso
  })
  paymentmethod: PaymentEntity[];
}
