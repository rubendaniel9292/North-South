import { ROLES } from '../../constants/roles';
import { BaseEntity } from '../../config/base.entity';
import { IUser } from '../../interface/user.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { TaskEntity } from './task.entity';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity implements IUser {
  @Column()
  firstName: string;

  @Column({ nullable: true })
  secondName: string;

  @Column()
  surname: string;

  @Column({ nullable: true })
  secondSurname: string;

  @Column({ unique: true })
  userName: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  //@Column({ type: 'enum', enum: ['BASIC', 'ADMIN'], default: 'ADMIN' })
  @Column({ type: 'enum', enum: ROLES })
  role: ROLES;

  //cuando se cree un usuario directamente en la BD, este campo está en true, forzando el cambio de contraseña en el primer inicio de sesión
  @Column({ default: true }) // Nuevo campo
  mustChangePassword: boolean;

  //relacion uno a varios:   un usuario puede tener muchas tareas
  @OneToMany(() => TaskEntity, (task) => task.users, { 
    nullable: true, 
    onDelete: 'CASCADE',//eliminar automáticamente las tareas  usando SQl o herramientas   de base de datos
    cascade: true  //Elimina tareas cuando usando métodos de TypeORM en tu aplicación
  })
  tasks: TaskEntity[];
}
