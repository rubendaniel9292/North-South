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
import { PaymentStatusEntity } from './payment.status.entity';

@Entity('payment_record')
export class PaymentEntity extends IdEntity {
  @Column()
  number_payment: number;

  @Column('decimal', { nullable: true, precision: 12, scale: 2 })
  value: number;

  @Column('decimal', { nullable: true, precision: 12, scale: 2 })
  pending_value: number;

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

  @Column()
  status_payment_id: number;

  // Relación uno a varios, varios pagos pueden estar asociados a una poliza
  @ManyToOne(() => PolicyEntity, (policy) => policy.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policies: PolicyEntity;

  // Cada pago puede asociarse con un solo estado de pago
  @ManyToOne(
    () => PaymentStatusEntity,
    (paymentStatus) => paymentStatus.payments,
    {
      onDelete: 'NO ACTION', // Previene que se borren los estados al eliminar pagos
    },
  )
  @JoinColumn({ name: 'status_payment_id' })
  paymentStatus: PaymentStatusEntity;
  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'created_at',
  })
  createdAt: Date;
  @Column({
    nullable: true,
    type: 'timestamp with time zone',
    name: 'updated_at',
  }
  )
  updatedAt: Date;
}