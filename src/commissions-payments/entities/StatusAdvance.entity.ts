import { CommissionsPaymentsEntity } from '@/commissions-payments/entities/CommissionsPayments.entity';
import { IdEntity } from '@/config/id.entity';
import { IStatusAdvance } from '@/interface/all.Interfaces';
import {
    Column, Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
@Entity({ name: 'status_advance' })
export class StatusAdvanceEntity extends IdEntity implements IStatusAdvance {
    @Column()
    statusNameAdvance: string;
    @OneToMany(
        () => CommissionsPaymentsEntity,
        (commissionsPayments) => commissionsPayments.statusAdvance
    )
    commissions: CommissionsPaymentsEntity[];
}


