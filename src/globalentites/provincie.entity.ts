import { Column, Entity, OneToMany } from 'typeorm';
import { IdEntity } from '../config/id.entity';
import { IProvince } from 'src/interface/all.Interfaces';
import { CityEntity } from './city.entity';
import { CustomersEntity } from '../customers/entities/customer.entity';
//tabla provincia
@Entity({ name: 'province' })
export class ProvinceEntity extends IdEntity implements IProvince {
  @Column()
  provinceName: string;
  //relacion uno a varios: una prvincia tiene varias ciudades
  @OneToMany(() => CityEntity, (city) => city.province, {
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  city: CityEntity[];

  //en una provincia pueden vivir muchos clientes
  @OneToMany(() => CustomersEntity, (customer) => customer.province, {
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  customer: ProvinceEntity[];
}
