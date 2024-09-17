import { IAccountType } from './../../interface/all.Interfaces';
import { Entity, Column, OneToMany } from 'typeorm';
import { IdEntity } from '@/config/id.entity';
import { BankAccountEntity } from './bank-account.entity';
@Entity('account_type')
export class AccountTypeEntity extends IdEntity implements IAccountType {
  @Column({ unique: true })
  typeName: string;

  // Relación con BankAccount
  @OneToMany(() => BankAccountEntity, (bankAccount) => bankAccount.accountType)
  bankAccounts: BankAccountEntity[];
}
