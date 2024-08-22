import { IdEntity } from '@/config/id.entity';
import { ICreditCard } from '@/interface/all.Interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  //BeforeInsert,
  //BeforeUpdate,
} from 'typeorm';
import { CardOptionsEntity } from './cardoptions.entity';
import { BankEntity } from './bank.entity';
//import { encrypt } from '@/helpers/encryption';
@Entity({ name: 'credit_card' })
export class CreditCardEntity extends IdEntity implements ICreditCard {
  @Column()
  customers_id: number;

  @Column()
  cardNumber: string;

  @Column()
  expirationDate: Date;

  @Column()
  code: string;

  @Column()
  card_option_id: number;

  @Column()
  bank_id: number;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;
  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
  })
  updatedAt: Date;
  /*

  @BeforeInsert()
  @BeforeUpdate()
  encryptSensitiveData() {
    this.cardNumber = encrypt(this.cardNumber);
    this.code = encrypt(this.code);
  }*/

  /*
  decryptSensitiveData() {
    this.cardNumber = dencrypt(this.cardNumber);
    this.code = decrypt(this.cardNumber);
  */

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
}
