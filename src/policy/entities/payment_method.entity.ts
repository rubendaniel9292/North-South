import { IdEntity } from '@/config/id.entity';
import { IPaymentMethod } from '@/interface/all.Interfaces';
import { Column, Entity, OneToMany } from 'typeorm';
import { PolicyEntity } from './policy.entity';
//import { AdvanceEntity } from '@/advisor/entity/advance.entity';
import { CommissionsPaymentsEntity } from '../../commissions-payments/entities/CommissionsPayments.entity';

@Entity({ name: 'payment_method' })
export class PaymentMethodEntity extends IdEntity implements IPaymentMethod {
  @Column({ unique: true })
  methodName: string;
  //Cada póliza puede asociarse con un solo método de pago
  @OneToMany(() => PolicyEntity, (policy) => policy.paymentMethod)
  policies: PolicyEntity[]; // Relación con PolicyEntity

  @OneToMany(() => CommissionsPaymentsEntity, (commissions) => commissions.paymentMethod)
  commissions: CommissionsPaymentsEntity[]; 
}
