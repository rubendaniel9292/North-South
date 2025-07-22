import { TaskDTO } from './../dto/task.dto';
import { UserEntity } from './../entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDTO, UserDTO } from '../dto/user.dto';
import { DeleteResult, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt-updated';
import { ErrorManager } from 'src/helpers/error.manager';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { TaskEntity } from '../entities/task.entity';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisModuleService,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
  ) { }


  //1:metodo para crear usuarios que haran usos del sistema
  public createUser = async (body: UserDTO): Promise<UserEntity> => {
    try {
      const pwd = parseInt(process.env.HASH_SALT);
      body.password = await bcrypt.hash(body.password, pwd);

      // Verificar si el correo ya existe registrado
      //body.email! le dice al compilador que body.email no es null ni undefined
      const existingUser = await this.userRepository.findOne({
        where: { email: body.email!.toLowerCase() },
      });
      if (existingUser) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'El correo ya está registrado',
        });
      }

      const newUser = await this.userRepository.save(body);
      await this.redisService.set(`newUser:${newUser.uuid}`, JSON.stringify(newUser), 32400);
      return newUser;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: metodo para encontrar usuarios
  public findUsers = async (): Promise<UserEntity[]> => {
    try {
      const cachedUsers = await this.redisService.get('users');
      if (cachedUsers) {
        return JSON.parse(cachedUsers);
      }
      const users: UserEntity[] = await this.userRepository.find(); //obtener el listado de usuarios el equivalente en sql SELECT * FROM users;
      /*const [users, count] = await this.userRepository
        .createQueryBuilder()
        .getManyAndCount();*/
      if (users.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      await this.redisService.set('users', JSON.stringify(users), 32400); // TTL de 1 hora
      return users;
    } catch (error) {
      //se ejecuta el errir
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3:metodo para buscar usuarios por id SELECT * FROM users WHERE id = '31850ef1-7e45-4164-a97f-066fea0c1016';
  public findUserById = async (uuid: string): Promise<UserEntity> => {
    try {
      /* otra manera igual funciona
      const user: UserEntity = await this.userRepository
        .createQueryBuilder('user')
        .where({ id })
        .getOne();*/

      const cachedUsers = await this.redisService.get('user');
      if (cachedUsers) {
        return JSON.parse(cachedUsers);
      }
      const user: UserEntity = await this.userRepository.findOne({
        where: { uuid },
      });

      if (!user) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      await this.redisService.set('user', JSON.stringify(user), 32400); // TTL de 1 hora
      return user;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //4: metodo para la compracion de la contraseña
  public findAndCompare = async ({
    key,
    value,
  }: {
    key: keyof UserDTO;
    value: any;
  }) => {
    try {
      const user: UserEntity = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password') //incluir la contraseña en la consulta para su comparacon
        .where({ [key]: value })
        .getOne();
      return user;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //4: metodo para borrar usuarios por id, lo mismo que hacer DELETE FROM users WHERE id = '780a7470-f485-436e-816f-ce33c5cca75e';
  public deleteUser = async (id: string): Promise<DeleteResult | undefined> => {
    try {
      const user: DeleteResult = await this.userRepository.delete(id);
      if (user.affected === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se pudo eliminar el usuario el usuario',
        });
      }
      // Eliminar el usuario de Redis
      await this.redisService.del(`user:${id}`);
      return user;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //5: metodo para actualizar la contraseña
  public updateUser = async (id: string, updateData: Partial<UpdateUserDTO>): Promise<UserEntity> => {
    try {
      await this.userRepository.update({ uuid: id }, updateData);
      const updatedUser: UserEntity = await this.userRepository.findOne({ where: { uuid: id } });
      if (!updatedUser) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se pudo actualizar el usuario',
        });
      }
      return updatedUser;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //6: Registro de tareas de un usuario
  public createTask = async (userId: string, body: TaskDTO): Promise<TaskEntity> => {
    try {
      const user: UserEntity = await this.userRepository.findOne({ where: { uuid: userId } });
      if (!user) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'Usuario no encontrado',
        });
      }
      // Asignar los datos de la tarea
      const newTask: TaskEntity = await this.taskRepository.save(body);
      await this.redisService.set(`task:${newTask.id}`, JSON.stringify(newTask), 32400);
      return newTask;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  //7: Obtener las tareas de un usuario
  public getTasksByUserId = async (userId: string): Promise<TaskEntity[]> => {
    try {
      const cachedTasks = await this.redisService.get(`tasks:${userId}`);
      if (cachedTasks) {
        return JSON.parse(cachedTasks);
      }
      const tasks: TaskEntity[] = await this.taskRepository.find({
        where: { users_uuid: userId },
      });
      await this.redisService.set(`tasks:${userId}`, JSON.stringify(tasks), 32400);
      return tasks;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  //8: metodo para elimiar una tarea por id (dar por termianda la tarea)
  public deleteTask = async (taskId: number): Promise<DeleteResult | undefined> => {
    try {
      const deletedTask: DeleteResult = await this.taskRepository.delete(taskId);
      if (deletedTask.affected === 0) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se pudo eliminar la tarea',
        });
      }
      // Eliminar la tarea de Redis
      await this.redisService.del(`task:${taskId}`);
      return deletedTask;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
