import { TaskDTO } from './../dto/task.dto';
import { UserEntity } from './../entities/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDTO, UserDTO } from '../dto/user.dto';
import { DeleteResult, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt-updated';
import { ErrorManager } from '@/helpers/error.manager';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { TaskEntity } from '../entities/task.entity';
import { CacheKeys } from '@/constants/cache.enum';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly CACHE_TTL = 3600; // 1 hora en segundos

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisModuleService,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
  ) { }


  //1: Método para crear usuarios que harán uso del sistema
  public createUser = async (body: UserDTO): Promise<UserEntity> => {
    try {
      this.logger.log(`Iniciando creación de usuario con email: ${body.email}`);

      const pwd = parseInt(process.env.HASH_SALT) || 10;

      // Normalizar email a minúsculas
      const normalizedEmail = body.email.toLowerCase().trim();

      // Verificar si el correo ya existe
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (existingUserByEmail) {
        this.logger.warn(`Intento de registro con email duplicado: ${normalizedEmail}`);
        throw new ErrorManager({
          type: 'CONFLICT',
          message: 'El correo electrónico ya está registrado',
        });
      }

      // Verificar si el username ya existe
      const existingUserByUsername = await this.userRepository.findOne({
        where: { userName: body.userName },
      });

      if (existingUserByUsername) {
        this.logger.warn(`Intento de registro con username duplicado: ${body.userName}`);
        throw new ErrorManager({
          type: 'CONFLICT',
          message: 'El nombre de usuario ya está en uso',
        });
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(body.password, pwd);

      const userData = {
        ...body,
        email: normalizedEmail,
        password: hashedPassword,
      };

      const newUser = await this.userRepository.save(userData);

      // Cache del nuevo usuario
      const cacheKey = `${CacheKeys.USER_BY_ID}${newUser.uuid}`;
      await this.redisService.set(cacheKey, newUser, this.CACHE_TTL);

      // Invalidar cache de lista de usuarios
      await this.redisService.del(CacheKeys.USERS_LIST);

      this.logger.log(`Usuario creado exitosamente con UUID: ${newUser.uuid}`);
      return newUser;

    } catch (error) {
      this.logger.error(`Error al crear usuario: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: Método para encontrar todos los usuarios
  public findUsers = async (): Promise<UserEntity[]> => {
    try {
      this.logger.log('Obteniendo lista de usuarios');

      // Verificar cache primero
      const cachedUsers = await this.redisService.get(CacheKeys.USERS_LIST);
      if (cachedUsers) {
        this.logger.log('Usuarios obtenidos desde cache');
        return cachedUsers;
      }

      // Obtener usuarios de la base de datos
      const users: UserEntity[] = await this.userRepository.find({
        relations: ['tasks'],
        order: { createdAt: 'DESC' }, // Ordenar por fecha de creación
      });

      if (users.length === 0) {
        this.logger.warn('No se encontraron usuarios en la base de datos');
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontraron usuarios registrados',
        });
      }

      // Guardar en cache
      await this.redisService.set(CacheKeys.USERS_LIST, users, this.CACHE_TTL);

      this.logger.log(`Se encontraron ${users.length} usuarios`);
      return users;

    } catch (error) {
      this.logger.error(`Error al obtener usuarios: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3: Método para buscar usuarios por UUID
  public findUserById = async (uuid: string): Promise<UserEntity> => {
    try {
      this.logger.log(`Buscando usuario con UUID: ${uuid}`);

      // Verificar cache específico del usuario
      const cacheKey = `${CacheKeys.USER_BY_ID}${uuid}`;
      const cachedUser = await this.redisService.get(cacheKey);
      if (cachedUser) {
        this.logger.log(`Usuario ${uuid} obtenido desde cache`);
        return cachedUser;
      }

      // Buscar en base de datos
      const user: UserEntity = await this.userRepository.findOne({
        where: { uuid },
        relations: ['tasks'], // Cargar las tareas relacionadas
      });

      if (!user) {
        this.logger.warn(`Usuario no encontrado con UUID: ${uuid}`);
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        });
      }

      // Guardar en cache
      await this.redisService.set(cacheKey, user, this.CACHE_TTL);

      this.logger.log(`Usuario ${uuid} encontrado y cacheado`);
      return user;

    } catch (error) {
      this.logger.error(`Error al buscar usuario ${uuid}: ${error.message}`, error.stack);
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
      //console.log(`💾 UserService.findAndCompare - Buscando por ${key}: ${value}`);

      const user: UserEntity = await this.userRepository.findOne({
        where: { [key]: value },
      });

      if (user) {
        console.log(`✅ Usuario encontrado en base de datos`);
      } else {
        console.log(`❌ Usuario NO encontrado por ${key}`);
      }

      return user;
    } catch (error) {
      console.error(`💥 Error en findAndCompare:`, error.message);
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //5: Método para eliminar usuarios por UUID
  public deleteUser = async (uuid: string): Promise<DeleteResult | undefined> => {
    try {
      //this.logger.log(`Iniciando eliminación de usuario: ${uuid}`);

      // Verificar que el usuario existe antes de eliminarlo
      const existingUser = await this.userRepository.findOne({
        where: { uuid },
        relations: ['tasks']
      });

      if (!existingUser) {
        //this.logger.warn(`Intento de eliminar usuario inexistente: ${uuid}`);
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        });
      }

      const result: DeleteResult = await this.userRepository.delete(uuid);

      if (result.affected === 0) {
        //this.logger.error(`No se pudo eliminar el usuario: ${uuid}`);
        throw new ErrorManager({
          type: 'INTERNAL_SERVER_ERROR',
          message: 'No se pudo eliminar el usuario',
        });
      }

      // Invalidar todos los caches relacionados con este usuario
      await this.redisService.del(`${CacheKeys.USER_BY_ID}${uuid}`);           // Cache específico del usuario
      await this.redisService.del(`${CacheKeys.USER_TASKS}${uuid}`);          // Cache de tareas del usuario
      await this.redisService.del(CacheKeys.USERS_LIST);             // Cache de lista de usuarios

      // Usar deletePattern para limpiar caches relacionados
      await this.redisService.deletePattern(`${CacheKeys.USER_BY_ID}${uuid}:*`);

      this.logger.log(`Usuario ${uuid} eliminado exitosamente`);
      return result;

    } catch (error) {
      this.logger.error(`Error al eliminar usuario ${uuid}: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //6: Método para actualizar usuario
  public updateUser = async (uuid: string, updateData: Partial<UpdateUserDTO>): Promise<UserEntity> => {
    try {
      //this.logger.log(`Actualizando usuario: ${uuid}`);

      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findOne({ where: { uuid } });
      if (!existingUser) {
        //this.logger.warn(`Intento de actualizar usuario inexistente: ${uuid}`);
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        });
      }

      // Si se está actualizando el email, verificar que no esté en uso
      if (updateData.email) {
        const normalizedEmail = updateData.email.toLowerCase().trim();
        const emailInUse = await this.userRepository.findOne({
          where: { email: normalizedEmail },
        });

        if (emailInUse && emailInUse.uuid !== uuid) {
          this.logger.warn(`Intento de actualizar con email duplicado: ${normalizedEmail}`);
          throw new ErrorManager({
            type: 'CONFLICT',
            message: 'El correo electrónico ya está en uso por otro usuario',
          });
        }
        updateData.email = normalizedEmail;
      }

      // Si se está actualizando el username, verificar que no esté en uso
      if (updateData.userName) {
        const usernameInUse = await this.userRepository.findOne({
          where: { userName: updateData.userName },
        });

        if (usernameInUse && usernameInUse.uuid !== uuid) {
          this.logger.warn(`Intento de actualizar con username duplicado: ${updateData.userName}`);
          throw new ErrorManager({
            type: 'CONFLICT',
            message: 'El nombre de usuario ya está en uso',
          });
        }
      }

      // Si se está actualizando la contraseña, encriptarla
      if (updateData.password) {
        const pwd = parseInt(process.env.HASH_SALT) || 10;
        updateData.password = await bcrypt.hash(updateData.password, pwd);
      }

      // Actualizar usuario
      const updateResult = await this.userRepository.update({ uuid }, updateData);

      if (updateResult.affected === 0) {
        this.logger.error(`No se pudo actualizar el usuario: ${uuid}`);
        throw new ErrorManager({
          type: 'INTERNAL_SERVER_ERROR',
          message: 'No se pudo actualizar el usuario',
        });
      }

      // Obtener usuario actualizado
      const updatedUser = await this.userRepository.findOne({
        where: { uuid },
        relations: ['tasks']
      });

      // Invalidar caches relacionados
      await this.redisService.del(`${CacheKeys.USER_BY_ID}${uuid}`);     // Cache específico del usuario
      await this.redisService.del(CacheKeys.USERS_LIST);       // Cache de lista de usuarios

      // Actualizar cache con nueva información
      await this.redisService.set(`${CacheKeys.USER_BY_ID}${uuid}`, updatedUser, this.CACHE_TTL);

      this.logger.log(`Usuario ${uuid} actualizado exitosamente`);
      return updatedUser;

    } catch (error) {
      this.logger.error(`Error al actualizar usuario ${uuid}: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //7: Método para crear tareas de un usuario
  public createTask = async (userId: string, body: TaskDTO): Promise<TaskEntity> => {
    try {
      //this.logger.log(`Creando tarea para usuario: ${userId}`);

      const user: UserEntity = await this.userRepository.findOne({ where: { uuid: userId } });
      if (!user) {
        //this.logger.warn(`Usuario no encontrado para crear tarea: ${userId}`);
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        });
      }

      // Crear la tarea y asignar la relación con el usuario
      const taskData = {
        ...body,
        users_uuid: userId, // Asignar el UUID del usuario
        users: user // Asignar la relación del usuario
      };

      const newTask: TaskEntity = await this.taskRepository.save(taskData);

      // Invalidar caches relacionados de forma consistente
      await this.redisService.del(`${CacheKeys.USER_TASKS}${userId}`);   // Cache de tareas del usuario
      await this.redisService.del(`${CacheKeys.USER_BY_ID}${userId}`);    // Cache del usuario específico
      await this.redisService.del(CacheKeys.USERS_LIST);        // Cache de lista de usuarios

      // Guardar cache de la nueva tarea
      await this.redisService.set(`${CacheKeys.TASK_BY_ID}${newTask.id}`, newTask, this.CACHE_TTL);

      //this.logger.log(`Tarea creada exitosamente: ${newTask.id} para usuario: ${userId}`);
      return newTask;

    } catch (error) {
      this.logger.error(`Error al crear tarea para usuario ${userId}: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //8: Método para obtener las tareas de un usuario
  public getTasksByUserId = async (userId: string): Promise<TaskEntity[]> => {
    try {
      //this.logger.log(`Obteniendo tareas para usuario: ${userId}`);

      const cachedTasks = await this.redisService.get(`${CacheKeys.USER_TASKS}${userId}`);
      if (cachedTasks) {
        this.logger.log(`Tareas obtenidas desde cache para usuario: ${userId}`);
        return cachedTasks;
      }

      const tasks: TaskEntity[] = await this.taskRepository.find({
        where: { users_uuid: userId },
        order: { id: 'DESC' }, // Ordenar por ID descendente (más recientes primero)
      });

      await this.redisService.set(`${CacheKeys.USER_TASKS}${userId}`, tasks, this.CACHE_TTL);

      //this.logger.log(`Se encontraron ${tasks.length} tareas para usuario: ${userId}`);
      return tasks;

    } catch (error) {
      this.logger.error(`Error al obtener tareas para usuario ${userId}: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //9: Método para eliminar una tarea por ID
  public deleteTask = async (taskId: number): Promise<DeleteResult | undefined> => {
    try {
      this.logger.log(`Eliminando tarea: ${taskId}`);

      // Primero obtener la tarea para saber a qué usuario pertenece
      const taskToDelete = await this.taskRepository.findOne({
        where: { id: taskId },
        relations: ['users']
      });

      if (!taskToDelete) {
        this.logger.warn(`Tarea no encontrada: ${taskId}`);
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'Tarea no encontrada',
        });
      }

      const deletedTask: DeleteResult = await this.taskRepository.delete(taskId);

      if (deletedTask.affected === 0) {
        this.logger.error(`No se pudo eliminar la tarea: ${taskId}`);
        throw new ErrorManager({
          type: 'INTERNAL_SERVER_ERROR',
          message: 'No se pudo eliminar la tarea',
        });
      }

      // Invalidar caches relacionados de forma consistente
      const userId = taskToDelete.users_uuid;
      await this.redisService.del(`${CacheKeys.TASK_BY_ID}${taskId}`);        // Cache de la tarea específica
      await this.redisService.del(`${CacheKeys.USER_TASKS}${userId}`);       // Cache de tareas del usuario
      await this.redisService.del(`${CacheKeys.USER_BY_ID}${userId}`);        // Cache del usuario específico
      await this.redisService.del(CacheKeys.USERS_LIST);            // Cache de lista de usuarios

      // Invalidar caches adicionales que puedan afectar dashboards o conteos
      await this.redisService.deletePattern(CacheKeys.DASHBOARD_PATTERN); // Cualquier cache de dashboard
      await this.redisService.deletePattern(CacheKeys.TASKS_PATTERN);     // Todos los caches de tareas
      await this.redisService.deletePattern(CacheKeys.PENDING_PATTERN);   // Caches de tareas pendientes

      this.logger.log(`Tarea eliminada exitosamente: ${taskId} de usuario: ${userId}`);
      return deletedTask;

    } catch (error) {
      this.logger.error(`Error al eliminar tarea ${taskId}: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
