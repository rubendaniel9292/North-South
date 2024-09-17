import { IBankAccount } from './../../interface/all.Interfaces';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { IdEntity } from '@/config/id.entity';

import { BankEntity } from '@/config/bank.entity';
import { AccountTypeEntity } from './account-type.entity';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { CustomersEntity } from '@/customers/entities/customer.entity';
//import { PolicyEntity } from '@/policy/entities/policy.entity';

@Entity('bank_account')
export class BankAccountEntity extends IdEntity implements IBankAccount {
  @Column()
  customers_id: number; // Asegúrate de definir el campo

  @Column()
  account_type_id: number; // Asegúrate de definir el campo

  @Column()
  bank_id: number; // Asegúrate de definir el campo

  @Column({ unique: true })
  accountNumber: string;

  @ManyToOne(
    () => AccountTypeEntity,
    (accountType) => accountType.bankAccounts,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'account_type_id' })
  accountType: AccountTypeEntity;

  // Relación ManyToOne: Muchas tarjetas están asociadas a un banco
  @ManyToOne(() => BankEntity, (bank) => bank.bankAccount, {
    onDelete: 'RESTRICT', // No permite la eliminación del banco si está en uso
  })
  @JoinColumn({ name: 'bank_id' })
  bank: BankEntity;

  @Column({ nullable: true })
  observations: string;

  // Relación OneToMany: Una cuenta puede estar asociada a varias pólizas
  @OneToMany(() => PolicyEntity, (policy) => policy.bankAccount)
  policies: PolicyEntity[];

  // Relación ManyToOne: Muchas cuentas pertenecen a un solo cliente
  @ManyToOne(() => CustomersEntity, (customer) => customer.bankAccount, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customers_id' })
  customer: CustomersEntity;

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
}
