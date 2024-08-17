import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { ICustomer } from '../../interface/all.Interfaces';
import { IdEntity } from '../../config/id.entity';
import { CivilStatusEntity } from '../../globalentites/civilstatus.entity';
import { ProvinceEntity } from '../../globalentites/provincie.entity';
import { CityEntity } from '../../globalentites/city.entity';
//tabla cliente

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
  status_id: number;

  @Column()
  birthdate: Date;

  @Column({ unique: true })
  email: string;

  @Column()
  numberPhone: string;

  @Column()
  province_id: number;

  @Column()
  city_id: number;

  @Column()
  address: string;

  @Column()
  personalData: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;
  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
  })
  updatedAt: Date;

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
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
    onUpdate: 'CASCADE', // Permite la actualización en cascada
  })
  @JoinColumn({ name: 'province_id' })
  province: ProvinceEntity; //relacion*/

  // Relación ManyToOne: Un cliente vive en una ciudad
  @ManyToOne(() => CityEntity, (city) => city.customer, {
    cascade: ['update'], // Permite la cascada de actualización
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
    onUpdate: 'CASCADE', // Permite la actualización en cascada
  })
  @JoinColumn({ name: 'city_id' })
  city: CityEntity;
}
