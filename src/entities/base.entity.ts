import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
//clase abstrcta para campos comunes en todas las entidades, no se peude isntanciar pero si heredar
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  /*@PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number; // Aquí debe ser number si usas bigin*/

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
}
