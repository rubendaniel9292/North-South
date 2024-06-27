import { ROLES } from '../../constants/roles';
import { BaseEntity } from '../../entities/base.entity';
import { IUser } from '../../interface/user.interface';
import { Column, Entity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity implements IUser {
  @Column()
  name: string;
  @Column()
  lastName: string;
  @Column({ unique: true })
  userName: string;
  @Column()
  email: string;
  @Exclude()
  @Column()
  password: string;
  //@Column({ type: 'enum', enum: ['BASIC', 'ADMIN'], default: 'ADMIN' })
  @Column({ type: 'enum', enum: ROLES })
  role: ROLES;
}
