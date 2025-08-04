
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { UserEntity } from '../entities/user.entity';
import { TaskEntity } from '../entities/task.entity';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { UserDTO, UpdateUserDTO } from '../dto/user.dto';
import { TaskDTO } from '../dto/task.dto';
import { ROLES } from '@/constants/roles';
import { ErrorManager } from '@/helpers/error.manager';
import * as bcrypt from 'bcrypt-updated';

// Mock de bcrypt
jest.mock('bcrypt-updated');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock de los repositorios
const mockUserRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  })),
};

const mockTaskRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

// Mock del RedisModuleService
const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  deletePattern: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<UserEntity>;
  let taskRepository: Repository<TaskEntity>;
  let redisService: RedisModuleService;

  beforeEach(async () => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(TaskEntity),
          useValue: mockTaskRepository,
        },
        {
          provide: RedisModuleService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    taskRepository = module.get<Repository<TaskEntity>>(getRepositoryToken(TaskEntity));
    redisService = module.get<RedisModuleService>(RedisModuleService);

    // Mock de variables de entorno
    process.env.HASH_SALT = '10';
  });

  describe('Basic functionality', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userDto: UserDTO = {
        firstName: 'John',
        surname: 'Doe',
        userName: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        role: ROLES.BASIC,
        secondName: '',
        secondSurname: '',
      };

      const mockUser = {
        uuid: 'test-uuid',
        ...userDto,
        email: 'john@example.com',
        password: 'hashedPassword',
      };

      mockUserRepository.findOne.mockResolvedValue(null); // No existe email ni username
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.createUser(userDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw error if email already exists', async () => {
      const userDto: UserDTO = {
        firstName: 'John',
        surname: 'Doe',
        userName: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        role: ROLES.BASIC,
        secondName: '',
        secondSurname: '',
      };

      mockUserRepository.findOne.mockResolvedValue({ uuid: 'existing-user' });

      await expect(service.createUser(userDto)).rejects.toThrow('El correo electrónico ya está registrado');
    });
  });

  describe('findUsers', () => {
    it('should return users from cache if available', async () => {
      const mockUsers = [{ uuid: 'user1' }, { uuid: 'user2' }];

      mockRedisService.get.mockResolvedValue(mockUsers);

      const result = await service.findUsers();

      expect(redisService.get).toHaveBeenCalledWith('users:list');
      expect(result).toEqual(mockUsers);
    });

    it('should fetch users from database if not in cache', async () => {
      const mockUsers = [{ uuid: 'user1' }, { uuid: 'user2' }];

      mockRedisService.get.mockResolvedValue(null);
      mockUserRepository.find.mockResolvedValue(mockUsers);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.findUsers();

      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['tasks'],
        order: { createdAt: 'DESC' },
      });
      expect(redisService.set).toHaveBeenCalledWith('users:list', mockUsers, 3600);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findUserById', () => {
    it('should return user from cache if available', async () => {
      const mockUser = { uuid: 'test-uuid', firstName: 'John' };

      mockRedisService.get.mockResolvedValue(mockUser);

      const result = await service.findUserById('test-uuid');

      expect(redisService.get).toHaveBeenCalledWith('user:test-uuid');
      expect(result).toEqual(mockUser);
    });

    it('should fetch user from database if not in cache', async () => {
      const mockUser = { uuid: 'test-uuid', firstName: 'John' };

      mockRedisService.get.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.findUserById('test-uuid');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { uuid: 'test-uuid' },
        relations: ['tasks'],
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockUser = { uuid: 'test-uuid', tasks: [] };
      const mockDeleteResult = { affected: 1 };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(mockDeleteResult);
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.deletePattern.mockResolvedValue(undefined);

      const result = await service.deleteUser('test-uuid');

      expect(userRepository.delete).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(mockDeleteResult);
    });
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const taskDto: TaskDTO = {
        users_uuid: 'test-uuid',
        description: 'Test task',
        statusTask: 0,
      };

      const mockUser = { uuid: 'test-uuid' };
      const mockTask = { id: 1, ...taskDto };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTaskRepository.save.mockResolvedValue(mockTask);
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.createTask('test-uuid', taskDto);

      expect(taskRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });
  });

  describe('getTasksByUserId', () => {
    it('should return tasks from cache if available', async () => {
      const mockTasks = [{ id: 1, description: 'Task 1' }];

      mockRedisService.get.mockResolvedValue(mockTasks);

      const result = await service.getTasksByUserId('test-uuid');

      expect(redisService.get).toHaveBeenCalledWith('tasks:test-uuid');
      expect(result).toEqual(mockTasks);
    });

    it('should fetch tasks from database if not in cache', async () => {
      const mockTasks = [{ id: 1, description: 'Task 1' }];

      mockRedisService.get.mockResolvedValue(null);
      mockTaskRepository.find.mockResolvedValue(mockTasks);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.getTasksByUserId('test-uuid');

      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { users_uuid: 'test-uuid' },
        order: { id: 'DESC' },
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const mockTask = { id: 1, users_uuid: 'test-uuid' };
      const mockDeleteResult = { affected: 1 };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.delete.mockResolvedValue(mockDeleteResult);
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.deletePattern.mockResolvedValue(undefined);

      const result = await service.deleteTask(1);

      expect(taskRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDeleteResult);
    });

    it('should throw error if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteTask(1)).rejects.toThrow('Tarea no encontrada');
    });
  });
});
