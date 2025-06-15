import { IdEntity } from '@/config/id.entity';
import { ICompany } from '@/interface/all.Interfaces';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { CommissionsPaymentsEntity } from '../../commissions-payments/entities/CommissionsPayments.entity';
@Entity({ name: 'company' })
export class CompanyEntity extends IdEntity implements ICompany {
  @Column({ unique: true })
  companyName: string;

  @Column({ unique: true })
  ci_ruc: string;

  //una compañia emite muchas polizas
  @OneToMany(() => PolicyEntity, (policy) => policy.company)
  policies: PolicyEntity[];

  /*
    @OneToMany(() => CommissionsPaymentsEntity, (commissions) => commissions.company)
    commissions: CommissionsPaymentsEntity[];
    */
}
