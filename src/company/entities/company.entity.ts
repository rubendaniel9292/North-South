import { IdEntity } from '@/config/id.entity';
import { ICompany } from '@/interface/all.Interfaces';
import { Column, Entity } from 'typeorm';
@Entity({ name: 'company' })
export class CompanyEntity extends IdEntity implements ICompany {
  @Column()
  companyName: string;

  @Column()
  ci_ruc: string;
}
