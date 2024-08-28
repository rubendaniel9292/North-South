import { IdCustomEntity } from '@/config/id.custom.entity';
import { CreditCardEntity } from '@/creditcard/entities/credit.card.entity';
import { CityEntity } from '@/globalentites/city.entity';
import { CivilStatusEntity } from '@/globalentites/civilstatus.entity';
import { ProvinceEntity } from '@/globalentites/provincie.entity';
import { ICustomer } from '@/interface/all.Interfaces';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';

//tabla cliente

@Entity({ name: 'customers' })
export class CustomersEntity extends IdCustomEntity implements ICustomer {
  @Column()
  status_id: number;

  @Column()
  province_id: number;

  @Column()
  city_id: number;

  @Column()
  address: string;

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
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  //guardar la relacion manytoone con la tabla civil status
  @JoinColumn({ name: 'status_id' })
  civil: CivilStatusEntity; //relacion

  // Relación ManyToOne: Un cliente vive en una provincia
  @ManyToOne(() => ProvinceEntity, (province) => province.customer, {
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  @JoinColumn({ name: 'province_id' })
  province: ProvinceEntity; //relacion*/

  // Relación ManyToOne: varios cliente vive en una ciudad
  @ManyToOne(() => CityEntity, (city) => city.customer, {
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  @JoinColumn({ name: 'city_id' })
  city: CityEntity;

  // Relación OneToMany: Un cliente puede tener muchas pólizas
  @OneToMany(() => PolicyEntity, (policy) => policy.customer)
  policies: PolicyEntity[];

  // Relación ManyToOne: Muchas tarjetas pertenecen a un solo cliente
  @ManyToOne(() => CustomersEntity, (customer) => customer.creditCards, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customers_id' })
  customer: CustomersEntity;

  // Relación OneToMany: Un cliente puede tener muchas tarjetas de crédito
  @OneToMany(() => CreditCardEntity, (creditCard) => creditCard.customer)
  creditCards: CreditCardEntity[];
}
/*EXPLICACIONES DE CONSTRAINS
 cascade: ['update']
Si tienes una entidad CityEntity y realizas una operación save() en la entidad CustomersEntity q
ue está relacionada con CityEntity, y además cascade: ['update'] está habilitado, 
los cambios realizados en la entidad CustomersEntity podrían afectar a CityEntity 
solo si la operación de actualización incluye modificar la entidad CityEntity en sí misma 
(por ejemplo, cambiar una referencia a una nueva ciudad).

onUpdate: 'CASCADE': Esta opción se usa para que, si cambias el valor de una clave primaria (id) en la tabla 
referenciada (por ejemplo, en la tabla CityEntity), 
dicho cambio se propague automáticamente a todas las tablas que tienen una relación con esa clave primaria. 
Es poco común que los id cambien en la mayoría de las aplicaciones, 
especialmente cuando son generados automáticamente y son valores numéricos únicos.
*/
