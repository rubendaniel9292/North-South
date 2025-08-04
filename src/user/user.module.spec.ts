
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserController } from './controller/user.controller';
import { UserService } from './services/user.service';
import { UserEntity } from './entities/user.entity';
import { TaskEntity } from './entities/task.entity';
import { RedisModuleService } from '../redis-module/services/redis-module.service';
import { HttpCustomService } from '../providers/http/http.service';

describe('UserModule', () => {
  let module: TestingModule;
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TaskEntity),
          useClass: Repository,
        },
        {
          provide: RedisModuleService,
          useValue: mockRedisService,
        },
        {
          provide: HttpCustomService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  describe('Module Structure', () => {
    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should have UserController', () => {
      expect(userController).toBeDefined();
      expect(userController).toBeInstanceOf(UserController);
    });

    it('should have UserService', () => {
      expect(userService).toBeDefined();
      expect(userService).toBeInstanceOf(UserService);
    });
  });

  describe('Module Configuration', () => {
    it('should have UserController configured', () => {
      expect(userController).toBeDefined();
      expect(userController).toBeInstanceOf(UserController);
    });

    it('should have UserService configured', () => {
      expect(userService).toBeDefined();
      expect(userService).toBeInstanceOf(UserService);
    });

    it('should have repositories configured', () => {
      const userRepo = module.get(getRepositoryToken(UserEntity));
      const taskRepo = module.get(getRepositoryToken(TaskEntity));
      expect(userRepo).toBeDefined();
      expect(taskRepo).toBeDefined();
    });
  });

  describe('Dependencies', () => {
    it('should have all required providers', () => {
      expect(userService).toBeDefined();
      expect(userController).toBeDefined();
      expect(module.get(getRepositoryToken(UserEntity))).toBeDefined();
      expect(module.get(getRepositoryToken(TaskEntity))).toBeDefined();
      expect(module.get(RedisModuleService)).toBeDefined();
      expect(module.get(HttpCustomService)).toBeDefined();
    });
  });
});
