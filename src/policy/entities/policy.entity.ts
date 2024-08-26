import { IdEntity } from '@/config/id.entity';
import { IPolicy } from '@/interface/all.Interfaces';
import { Column, Entity, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity({ name: 'policy' })
export class PolicyEntity extends IdEntity implements IPolicy {
  @Column({ unique: true })
  numberPolicy: string;

  @Column()
  coverageAmount: number;

  @Column()
  agencyPercentage: number;

  @Column({ unique: true })
  advisorPercentage: number;

  @Column()
  policyValue: number;

  @Column()
  numberOfPayments: number;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  paymentsToAdvisor: number;

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
}
