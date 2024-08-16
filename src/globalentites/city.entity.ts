import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { IdEntity } from '../config/id.entity';
import { ICity } from 'src/interface/all.Interfaces';
import { ProvinceEntity } from './provincie.entity';
import { CustomersEntity } from '../customers/entities/customer.entity';
//tabla ciudad/canton
@Entity({ name: 'city' })
export class CityEntity extends IdEntity implements ICity {
  @Column()
  cityName: string;
  //RELACION VARIOS A UNO: VARIAS CIUDADES PERTENECEN A  UNA PROVINCIA
  @ManyToOne(() => ProvinceEntity, (province) => province.city, {
    cascade: ['update'], // Permite la cascada de actualización
    onDelete: 'NO ACTION', // No permite la eliminación en cascada
    onUpdate: 'CASCADE', // Permite la actualización en cascada
  })
  //guardar la relacion manytoone con la tabla provincia
  @JoinColumn({ name: 'province_id' })
  province: ProvinceEntity; //relacion

  //en una ciudad pueden vivir muchos clientes
  @OneToMany(() => CustomersEntity, (customer) => customer.city, {
    cascade: ['update'], // Permite la cascada de actualización
    onDelete: 'NO ACTION', // No permite la eliminación en cascada
    onUpdate: 'CASCADE', // Permite la actualización en cascada
  })
  customer: CustomersEntity[];
}
