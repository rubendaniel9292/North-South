/*
import { Entity, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { PaymentMethodEntity } from '@/policy/entities/payment_method.entity'; // Asegúrate de importar la entidad PaymentMethod si existe
import { CompanyEntity } from '@/company/entities/company.entity'; // Asegúrate de importar la entidad Company si existe
import { IdEntity } from '@/config/id.entity';
import { IAdvance } from '@/interface/all.Interfaces';
import { AdvisorEntity } from './advisor.entity';
/*
@Entity('advance')
export class AdvanceEntity extends IdEntity implements IAdvance {

    @Column({ unique: true })
    receiptNumber: string; // Número de recibo

    @Column('decimal', { precision: 12, scale: 2 })
    advanceValue: number; // Valor de anticipo

    @Column()
    createdAt: Date;

    @Column({nullable:true})
    company_id?: number;

    @Column()
    payment_method_id: number;

    @Column()
    advisor_id: number;

    @Column({ nullable: true })
    observations: string;

    // Un anticipo pertenece a un asesor
    /* Si se elimina un asesor, los anticipos que estaban relacionados con él no se eliminarán,
    pero el campo advisor en los anticipos quedará como NULL*/
    /*Si se elimina un asesor, todos los anticipos relacionado
     con ese asesor también se eliminarán automáticamente*/
    /*
    @ManyToOne(() => AdvisorEntity, (advisor) => advisor.advances, {
        onDelete: 'SET NULL', // Eliminar asesor deja este campo en NULL
        nullable: true,       // Permite que un anticipo quede sin asesor
    })
    advisor: AdvisorEntity;

    @ManyToOne(() => PaymentMethodEntity, (paymentMethod) => paymentMethod.advances, {
        onDelete: 'SET NULL', // Eliminar método de pago deja este campo en NULL
        nullable: true,       // Permite que un anticipo quede sin asesor
    })
    paymentMethod: PaymentMethodEntity;
*/
/*
}*/
