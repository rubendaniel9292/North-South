import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PolicyEntity } from './policy.entity';
import { IdEntity } from '@/config/id.entity';
import { IPolicyPeriodData } from '@/interface/all.Interfaces';


@Entity({ name: 'policy_period_data' })
export class PolicyPeriodDataEntity extends IdEntity implements IPolicyPeriodData {
    @Column()
    policy_id: number;

    @Column()
    year: number;

    @Column('decimal', { precision: 12, scale: 2 })
    policyValue: number;

    @Column('decimal', { precision: 5, scale: 2 })
    agencyPercentage: number;

    @Column('decimal', { precision: 5, scale: 2 })
    advisorPercentage: number;

    @Column('decimal', { precision: 12, scale: 2, nullable: true })
    policyFee: number;

    @ManyToOne(() => PolicyEntity, policy => policy.periods, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'policy_id' })
    policy: PolicyEntity;
}