import { IdCustomEntity } from '@/config/id.custom.entity';
import { CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';
@Entity({ name: 'advisor' })
export class AdvisdorEntity extends IdCustomEntity {
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
}
