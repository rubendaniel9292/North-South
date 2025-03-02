import { IdEntity } from '@/config/id.entity';
import { ICreditCard } from '@/interface/all.Interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
  //BeforeInsert,
  //BeforeUpdate,
} from 'typeorm';
import { CardOptionsEntity } from './cardoptions.entity';
import { BankEntity } from '../../config/bank.entity';
import { CardStatusEntity } from './card.status.entity';
import { CustomersEntity } from '@/customers/entities/customer.entity';
import { PolicyEntity } from '@/policy/entities/policy.entity';
//import { encrypt } from '@/helpers/encryption';
@Entity({ name: 'credit_card' })
export class CreditCardEntity extends IdEntity implements ICreditCard {
  @Column()
  customers_id: number;

  @Column()
  cardNumber: string;

  @Column(
    {
      type: 'timestamp with time zone',
      name: 'expiration_date',
    }
  )
  expirationDate: Date;

  @Column()
  code: string;

  @Column()
  card_option_id: number;

  @Column()
  bank_id: number;

  @Column()
  card_status_id: number;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'created_at',
  })
  createdAt: Date;
  @UpdateDateColumn({
    type: 'timestamp with time zone',
    name: 'updated_at',
  })
  updatedAt: Date;

  // Relación ManyToOne: Muchas tarjetas pertenecen a un solo cliente
  @ManyToOne(() => CustomersEntity, (customer) => customer.creditCards, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customers_id' })
  customer: CustomersEntity;

  // Relación ManyToOne: Muchas tarjetas tienen un tipo
  @ManyToOne(() => CardOptionsEntity, (cardoption) => cardoption.creditcard, {
    onDelete: 'RESTRICT', // No permite la eliminación del tipo de tarjeta si está en uso
  })
  @JoinColumn({ name: 'card_option_id' })
  cardoption: CardOptionsEntity;

  // Relación ManyToOne: Muchas tarjetas están asociadas a un banco
  @ManyToOne(() => BankEntity, (bank) => bank.creditcard, {
    onDelete: 'RESTRICT', // No permite la eliminación del banco si está en uso
  })
  @JoinColumn({ name: 'bank_id' })
  bank: BankEntity;

  // Relación ManyToOne: Muchas tarjetas tienen un estado
  @ManyToOne(() => CardStatusEntity, (cardstatus) => cardstatus.creditcard, {
    onDelete: 'RESTRICT', // No permite la eliminación del estado si está en uso
  })
  @JoinColumn({ name: 'card_status_id' })
  cardstatus: CardStatusEntity;

  // Relación OneToMany: Una tarjeta puede estar asociada a varias pólizas
  @OneToMany(() => PolicyEntity, (policy) => policy.creditCard)
  policies: PolicyEntity[];
}
