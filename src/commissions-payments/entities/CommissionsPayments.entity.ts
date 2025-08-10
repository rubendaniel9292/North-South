import { IdEntity } from '@/config/id.entity';
import { ICommissionsPayments } from '@/interface/all.Interfaces';
import {
    Column, Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { CompanyEntity } from '@/company/entities/company.entity';
import { AdvisorEntity } from '@/advisor/entities/advisor.entity';
import { PaymentMethodEntity } from '@/policy/entities/payment_method.entity';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { StatusAdvanceEntity } from './StatusAdvance.entity';

@Entity('commissions_payments')
export class CommissionsPaymentsEntity extends IdEntity implements ICommissionsPayments {

    @Column()
    receiptNumber: string;

    @Column('decimal', { precision: 12, scale: 2 })
    advanceAmount: number;

    @Column({
        type: 'timestamp with time zone',
        name: 'created_at',
    })
    createdAt: Date;

    @Column({ nullable: true })
    observations?: string;

    @Column()
    advisor_id: number;

    @Column()
    payment_method_id: number;

    @Column({ nullable: true })
    policy_id?: number;

    // RELACION CON METODOS DE PAGOS
    @ManyToOne(
        () => PaymentMethodEntity,
        (paymentMethod) => paymentMethod.commissions, { onDelete: 'RESTRICT' },
    )
    @JoinColumn({ name: 'payment_method_id' })
    paymentMethod: PaymentMethodEntity;

    //RELACION CON ASESOR
    @ManyToOne(() => AdvisorEntity, (advisor) => advisor.commissions, {
        onDelete: 'SET NULL', // Eliminar asesor deja este campo en NULL
        nullable: true,       // Permite que un anticipo quede sin asesor
    })
    @JoinColumn({ name: 'advisor_id' })
    advisor: AdvisorEntity;

    //RELACION CON POLIZAS
    @ManyToOne(() => PolicyEntity, (policy) => policy.commissions, { 
        nullable: true,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'policy_id' })
    policy: PolicyEntity;

    // RELACION CON ESTADO DE ANTICIPO (solo si es anticipo, si no es null)
    @Column({ name: 'status_advance_id', nullable: true })
    status_advance_id?: number | null;

    @ManyToOne(() => StatusAdvanceEntity, (statusAdvance) => statusAdvance.commissions, { nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'status_advance_id' })
    statusAdvance: StatusAdvanceEntity;

}
