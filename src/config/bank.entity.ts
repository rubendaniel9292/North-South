import {
  Column,
  //CreateDateColumn,
  Entity,
  OneToMany,
  // JoinColumn,
  //ManyToOne,
} from 'typeorm';
import { CreditCardEntity } from '../creditcard/entities/credit.card.entity';
import { IBank } from '@/interface/all.Interfaces';
import { IdEntity } from '@/config/id.entity';
import { BankAccountEntity } from '@/bankaccount/entities/bank-account.entity';

@Entity({ name: 'bank' })
export class BankEntity extends IdEntity implements IBank {
  @Column({ unique: true })
  bankName: string;

  // Relación uno a varios: un banco emite muchas tarjetas
  @OneToMany(() => CreditCardEntity, (creditcard) => creditcard.bank, {
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  creditcard: CreditCardEntity[];

  // Relación uno a varios: un banco emite muchas cuentas
  @OneToMany(() => BankAccountEntity, (bankAccount) => bankAccount.bank, {
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  bankAccount: BankAccountEntity[];
}
