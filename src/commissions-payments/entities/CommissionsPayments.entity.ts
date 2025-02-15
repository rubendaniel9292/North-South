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

@Entity('commissions_payments')
export class CommissionsPaymentsEntity extends IdEntity implements ICommissionsPayments {

    @Column({ unique: true })
    receiptNumber: string;

    @Column('decimal', { precision: 12, scale: 2 })
    advanceAmount: number;

    @Column()
    createdAt: Date;

    @Column({ nullable: true })
    observations: string;

    @Column()
    advisor_id: number;

    @Column()
    payment_method_id: number;

    @Column()
    company_id: number;

    // Muchas polizas son vendidas por un asesor
    /*
    @ManyToOne(() => AdvisorEntity, (advisor) => advisor.policies, {
        onDelete: 'RESTRICT', // No permite eliminar el asesor si tiene pólizas asociadas
    })
    @JoinColumn({ name: 'advisor_id' })
    advisor: AdvisorEntity;*/

    // RELACION CON METODOS DE PAGOS
    @ManyToOne(
        () => PaymentMethodEntity,
        (paymentMethod) => paymentMethod.commissions, { onDelete: 'RESTRICT' },
    )
    @JoinColumn({ name: 'payment_method_id' })
    paymentMethod: PaymentMethodEntity;

    // RELACION CON COMPAÑIAS
    @ManyToOne(() => CompanyEntity, (company) => company.commissions, {
        onDelete: 'RESTRICT', // No permite eliminar la compañía si tiene pólizas asociadas
    })
    @JoinColumn({ name: 'company_id' })
    company: CompanyEntity;

    //RELACION CON ASESOR
    @ManyToOne(() => AdvisorEntity, (advisor) => advisor.commissions, {
        onDelete: 'SET NULL', // Eliminar asesor deja este campo en NULL
        nullable: true,       // Permite que un anticipo quede sin asesor
    })
    @JoinColumn({ name: 'advisor_id' })
    advisor: AdvisorEntity;

}
