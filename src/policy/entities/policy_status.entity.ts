import { Column, Entity, OneToMany } from 'typeorm';
import { IdEntity } from '@/config/id.entity';
import { IPolicyStatus } from '@/interface/all.Interfaces';
import { PolicyEntity } from './policy.entity';
@Entity({ name: 'policy_status' })
export class PolicyStatusEntity extends IdEntity implements IPolicyStatus {
  @Column({ unique: true })
  statusName: string;

  //relacion uno a varios, un estado puede pertenecer a muchas polizas
  @OneToMany(() => PolicyEntity, (policy) => policy.policyStatus)
  policies: PolicyEntity[];
}
