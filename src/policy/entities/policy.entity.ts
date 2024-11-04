import { IdEntity } from '@/config/id.entity';
import { IPolicy } from '@/interface/all.Interfaces';
import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { PolicyTypeEntity } from './policy_type.entity';
import { PolicyStatusEntity } from './policy_status.entity';
import { PaymentFrequencyEntity } from './payment_frequency.entity';
import { CompanyEntity } from '@/company/entities/company.entity';
import { AdvisorEntity } from '@/advisor/entity/advisor.entity';
import { CustomersEntity } from '@/customers/entities/customer.entity';
import { CreditCardEntity } from '@/creditcard/entities/credit.card.entity';
import { PaymentMethodEntity } from './payment_method.entity';
import { BankAccountEntity } from '@/bankaccount/entities/bank-account.entity';
import { PaymentEntity } from '@/payment/entity/payment.entity';
import { RenewalEntity } from './renewal.entity';
@Entity({ name: 'policy' })
export class PolicyEntity extends IdEntity implements IPolicy {
  @Column({ unique: true })
  numberPolicy: string;

  @Column()
  policy_type_id: number;

  @Column()
  company_id: number;

  @Column()
  policy_status_id: number;

  payment_frequency_id: number;

  @Column()
  customers_id: number;

  @Column()
  advisor_id: number;

  @Column()
  payment_method_id: number;

  @Column({ nullable: true })
  credit_card_id: number;

  @Column({ nullable: true })
  bank_account_id: number;

  @Column('decimal', { precision: 12, scale: 2 })
  coverageAmount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  agencyPercentage: number;

  @Column('decimal', { precision: 5, scale: 2 })
  advisorPercentage: number;

  @Column('decimal', { precision: 12, scale: 2 })
  policyValue: number;

  @Column()
  numberOfPayments: number;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  policyFee: number;

  @Column('decimal', { precision: 12, scale: 2 })
  paymentsToAdvisor: number;

  @Column()
  numberOfPaymentsAdvisor: number;

  @Column({ nullable: true })
  observations: string;

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

  //relacion varios a uno: muchas poliza tiene un tipo de poliza
  @ManyToOne(() => PolicyTypeEntity, (policyType) => policyType.policies, {
    onDelete: 'RESTRICT', // Esto evita la eliminación en cascada
  })
  @JoinColumn({ name: 'policy_type_id' }) // Nombre de la columna que actúa como la clave foránea
  policyType: PolicyTypeEntity;
  //relacion varios a uno: muchas polizas tienen un solo estadi

  @ManyToOne(
    () => PolicyStatusEntity,
    (policyStatus) => policyStatus.policies,
    {
      onDelete: 'RESTRICT', // Evita la eliminación en cascada
    },
  )
  @JoinColumn({ name: 'policy_status_id' }) // Nombre de la columna en la tabla policy
  policyStatus: PolicyStatusEntity;

  //las polizas tienen una frecuencia de pago
  @ManyToOne(
    () => PaymentFrequencyEntity,
    (paymentFrequency) => paymentFrequency.policies,
    {
      onDelete: 'RESTRICT', // No permite eliminar la frecuencia de pago si hay pólizas relacionadas
    },
  )
  @JoinColumn({ name: 'payment_frequency_id' })
  paymentFrequency: PaymentFrequencyEntity;

  //muchas polizas son emitidas por una compañia
  @ManyToOne(() => CompanyEntity, (company) => company.policies, {
    onDelete: 'RESTRICT', // No permite eliminar la compañía si tiene pólizas asociadas
  })
  @JoinColumn({ name: 'company_id' })
  company: CompanyEntity;

  //muchas polizas son vendidas por un asesor
  @ManyToOne(() => AdvisorEntity, (advisor) => advisor.policies, {
    onDelete: 'RESTRICT', // No permite eliminar el asesor si tiene pólizas asociadas
  })
  @JoinColumn({ name: 'advisor_id' })
  advisor: AdvisorEntity;

  //una poliza pertenece a un solo cliente
  @ManyToOne(() => CustomersEntity, (customer) => customer.policies, {
    onDelete: 'RESTRICT', // No permite eliminar el cliente si tiene pólizas asociadas
  })
  @JoinColumn({ name: 'customers_id' })
  customer: CustomersEntity;

  //Cada póliza puede asociarse con un solo método de pago
  @ManyToOne(
    () => PaymentMethodEntity,
    (paymentMethod) => paymentMethod.policies,
  )
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethodEntity; // Relación con PaymentEntity

  //muchas polizas pueden estar asociadas a una tarejta
  @ManyToOne(() => CreditCardEntity, (creditCard) => creditCard.policies, {
    nullable: true, // Si la relación es opcional
    onDelete: 'SET NULL', // Opcional: Esto establece el campo en NULL si se elimina la tarjeta
  })
  @JoinColumn({ name: 'credit_card_id' })
  creditCard?: CreditCardEntity;

  //muchas polizas pueden estar asociadas a una cuenta bancaria
  @ManyToOne(() => BankAccountEntity, (bankAccount) => bankAccount.policies, {
    nullable: true, // Si la relación es opcional
    onDelete: 'SET NULL', // Opcional: Esto establece el campo en NULL si se elimina la cuenta
  })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount?: BankAccountEntity;
  //una poliza tiene varios pagos
  @OneToMany(() => PaymentEntity, (payment) => payment.policies, {
    onDelete: 'CASCADE', //Si elimina una póliza, todas los pagos asociados también se eliminan automáticamente.
  })
  payments: PaymentEntity[];

  //una poliza tiene varias renovaciones
  @OneToMany(() => RenewalEntity, (renewal) => renewal.policy, {
    nullable: true,
    onDelete: 'CASCADE', //Si elimina una póliza, todas las renovaciones asociadas también se eliminan automáticamente.
  })
  renewals?: RenewalEntity[]; // Hacemos que sea opcional usando el signo "?".
}
