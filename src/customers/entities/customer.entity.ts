import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ICustomer } from '../../interface/all.Interfaces';
import { IdEntity } from '../../config/id.entity';
import { CivilStatusEntity } from '../../globalentites/civilstatus.entity';
import { ProvinceEntity } from '../../globalentites/provincie.entity';
import { CityEntity } from '../../globalentites/city.entity';
//tabla cliente
console.log('civil status entity');
@Entity({ name: 'customers' })
export class CustomersEntity extends IdEntity implements ICustomer {
  @Column({ unique: true })
  ci_ruc: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  secondName: string;

  @Column()
  surname: string;

  @Column({ nullable: true })
  secondSurname: string;

  @Column()
  birthdate: Date;

  @Column({ unique: true })
  email: string;

  @Column()
  numberPhone: string;

  @Column()
  address: string;

  @Column()
  personalData: boolean;

  // Relación ManyToOne: Muchas personas tienen un estado civil
  @ManyToOne(() => CivilStatusEntity, (civil) => civil.customer, {
    cascade: ['update'],
  })
  //guardar la relacion manytoone con la tabla civil status
  @JoinColumn({ name: 'status_id' })
  civil: CivilStatusEntity; //relacion

  // Relación ManyToOne: Un cliente vive en una provincia
  @ManyToOne(() => ProvinceEntity, (province) => province.customer, {
    cascade: ['update'], // Permite la cascada de actualización
    onDelete: 'NO ACTION', // No permite la eliminación en cascada
    onUpdate: 'CASCADE', // Permite la actualización en cascada
  })
  @JoinColumn({ name: 'province_id' })
  province: ProvinceEntity; //relacion*/

  // Relación ManyToOne: Un cliente vive en una ciudad
  @ManyToOne(() => CityEntity, (city) => city.customer, {
    cascade: ['update'], // Permite la cascada de actualización
    onDelete: 'NO ACTION', // No permite la eliminación en cascada
    onUpdate: 'CASCADE', // Permite la actualización en cascada
  })
  @JoinColumn({ name: 'city_id' })
  city: CityEntity;
}
