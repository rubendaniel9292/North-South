import { Column, Entity, OneToMany } from 'typeorm';
import { IdEntity } from '../config/id.entity';
import { ICivilStatus } from '../interface/all.Interfaces';
import { CustomersEntity } from '../customers/entities/customer.entity';
//tabla estado civil
console.log('civil status entity');
@Entity({ name: 'civil_status' })
export class CivilStatusEntity extends IdEntity implements ICivilStatus {
  @Column({ unique: true })
  status: string;
  //relacion uno a varios: un estado civil tiene  varias personas
  @OneToMany(() => CustomersEntity, (customer) => customer.civil)
  customer: CustomersEntity[];
}
