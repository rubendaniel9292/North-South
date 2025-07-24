

import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { ITask } from '@/interface/all.Interfaces';
import { UserEntity } from './user.entity';
import { IdEntity } from '@/config/id.entity';

@Entity({ name: 'task' })
export class TaskEntity extends IdEntity implements ITask {
    @Column()
    description: string;

    @Column()
    statusTask: number;

    @Column()
    users_uuid: string;

    //relacion muchos a uno: una tarea pertenece a un usuario
    @ManyToOne(() => UserEntity, (user) => user.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'users_uuid' })
    users: UserEntity;
}