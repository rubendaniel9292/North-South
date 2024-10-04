import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IdEntity } from '@/config/id.entity';
import { PolicyEntity } from '@/policy/entities/policy.entity';

@Entity('payment_record')
export class PaymentEntity extends IdEntity {
  @Column({unique:true})
  number_payment: number;

  @Column('decimal', { nullable: true, precision: 12, scale: 2 })
  value: number;

  @Column('decimal', { nullable: true, precision: 12, scale: 2 })
  credit?: number;

  @Column('decimal', { nullable: true, precision: 12, scale: 2 })
  balance?: number;

  @Column('decimal', { precision: 12, scale: 2 })
  total: number;

  @Column({ nullable: true })
  observations?: string;

  @Column()
  policy_id: number;

  // Relación uno a varios, varios pagos pueden estar asociados a una poliza
  @ManyToOne(() => PolicyEntity, (policy) => policy.payments)
  @JoinColumn({ name: 'policy_id' })
  policies: PolicyEntity;

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
