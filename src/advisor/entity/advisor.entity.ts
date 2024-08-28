import { IdCustomEntity } from '@/config/id.custom.entity';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { CreateDateColumn, Entity, OneToMany, UpdateDateColumn } from 'typeorm';
@Entity({ name: 'advisor' })
export class AdvisorEntity extends IdCustomEntity {
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

  //un asesor vende muchas polizas
  @OneToMany(() => PolicyEntity, (policy) => policy.advisor)
  policies: PolicyEntity[];
}
