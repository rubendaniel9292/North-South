import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
//clase abstrcta para campos comunes en todas las entidades, no se peude isntanciar pero si heredar
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

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
