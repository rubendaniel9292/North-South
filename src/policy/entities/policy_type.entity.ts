import { IdEntity } from '@/config/id.entity';
import { IPolicyType } from '@/interface/all.Interfaces';
import { Entity, Column } from 'typeorm';
@Entity({ name: 'policy_type' })
export class PolicyTypeEntity extends IdEntity implements IPolicyType {
  @Column()
  policyName: string;
}
