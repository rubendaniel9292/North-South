
import { IdEntity } from '@/config/id.entity';
import { ICommissionRefunds } from '@/interface/all.Interfaces';
import {
    Column, Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';

import { PolicyEntity } from '@/policy/entities/policy.entity';
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
    policy_id: number;

    @ManyToOne(() => PolicyEntity, (policy) => policy.commissionRefunds)
    @JoinColumn({ name: 'policy_id' })
    policy: PolicyEntity;

    @Column(
        {
            type: 'timestamp with time zone',
            name: 'cancellation_date'
        }
    )
    cancellationDate: Date;

    @Column({
        type: 'timestamp with time zone',
        name: 'created_at'
    })
    createdAt: Date;

}
