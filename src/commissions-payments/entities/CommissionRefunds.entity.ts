
import { IdEntity } from '@/config/id.entity';
import { ICommissionRefunds } from '@/interface/all.Interfaces';
import {
    Column, CreateDateColumn, Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';

import { PolicyEntity } from '@/policy/entities/policy.entity';
import { AdvisorEntity } from '@/advisor/entities/advisor.entity';
@Entity('commission_refunds')
export class CommissionRefundsEntity extends IdEntity implements ICommissionRefunds {
    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    amountRefunds: number;

    @Column()
    reason: string;

    @Column()
    advisor_id: number;
    @ManyToOne(() => AdvisorEntity, (advisor) => advisor.commissionRefunds)
    @JoinColumn({ name: 'advisor_id' })
    advisor: AdvisorEntity;

    @Column()
    policy_id: number;
    @ManyToOne(() => PolicyEntity, (policy) => policy.commissionRefunds, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'policy_id' })
    policy: PolicyEntity;

    @Column(
        {
            type: 'timestamp with time zone',
            name: 'cancellation_date'
        }
    )
    cancellationDate: Date;

    @CreateDateColumn({
        type: 'timestamp with time zone',
        name: 'created_at'
    })
    createdAt: Date;

}
