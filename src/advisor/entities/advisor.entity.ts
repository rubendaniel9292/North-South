import { CommissionsPaymentsEntity } from '@/commissions-payments/entities/CommissionsPayments.entity';
import { IdCustomEntity } from '@/config/id.custom.entity';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { CreateDateColumn, Entity, ManyToOne, OneToMany, UpdateDateColumn } from 'typeorm';
//import { AdvanceEntity } from './advance.entity';

@Entity({ name: 'advisor' })
export class AdvisorEntity extends IdCustomEntity {
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

  //un asesor vende muchas polizas
  @OneToMany(() => PolicyEntity, (policy) => policy.advisor)
  policies: PolicyEntity[];

  //un asesor puede pedir varios anticipos

  // Un asesor puede tener varios anticipos o avances
  /*
  @OneToMany(() => AdvanceEntity, (advance) => advance.advisor)
  advances: AdvanceEntity[];*/

  // Un asesor puede tener varios anticipos
  @OneToMany(() => CommissionsPaymentsEntity, (commissions) => commissions.advisor)
  commissions: CommissionsPaymentsEntity[];

}


