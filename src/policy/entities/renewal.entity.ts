import { IdEntity } from '@/config/id.entity';
import { IRenewall } from '@/interface/all.Interfaces';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';

import { PolicyEntity } from './policy.entity';

@Entity('renewal')
export class RenewalEntity extends IdEntity implements IRenewall {
  @Column({ unique: true, nullable: true })
  renewalNumber?: number;

  @Column({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt?: Date;

  //varias renovaciones pertenecen a una poliza
  @ManyToOne(() => PolicyEntity, (policy) => policy.renewals, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'policy_id' }) // Define la columna de clave foránea
  policy: PolicyEntity;
}
