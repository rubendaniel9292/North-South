import { Column, Entity } from 'typeorm';
import { IdEntity } from '@/config/id.entity';
import { IPolicyStatus } from '@/interface/all.Interfaces';
@Entity({ name: 'policy_status' })
export class PolicyStatusEntity extends IdEntity implements IPolicyStatus {
  @Column({ unique: true })
  statusName: string;
}
