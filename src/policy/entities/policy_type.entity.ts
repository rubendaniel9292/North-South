import { IdEntity } from '@/config/id.entity';
import { IPolicyType } from '@/interface/all.Interfaces';
import { Entity, Column, OneToMany } from 'typeorm';
import { PolicyEntity } from './policy.entity';
@Entity({ name: 'policy_type' })
export class PolicyTypeEntity extends IdEntity implements IPolicyType {
  @Column({ unique: true })
  policyName: string;

  //relacion uno a varios: un tipo de poliza tienen muchas polizas
  @OneToMany(() => PolicyEntity, (policy) => policy.policyType)
  policies: PolicyEntity[];
}
