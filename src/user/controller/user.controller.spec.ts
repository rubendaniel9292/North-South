
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { UserDTO, UpdateUserDTO } from '../dto/user.dto';
import { TaskDTO } from '../dto/task.dto';
import { ROLES } from '@/constants/roles';

// Mock del UserService
const mockUserService = {
  createUser: jest.fn(),
  findUsers: jest.fn(),
  findUserById: jest.fn(),
  deleteUser: jest.fn(),
  updateUser: jest.fn(),
  createTask: jest.fn(),
  getTasksByUserId: jest.fn(),
  deleteTask: jest.fn(),
};

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  describe('Basic functionality', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.createUser.mockResolvedValue(mockUser);

      const result = await controller.registerUser(userDto);

      expect(userService.createUser).toHaveBeenCalledWith(userDto);
      expect(result).toEqual({
        status: 'success',
        newUser: mockUser,
      });
    });
  });

  describe('findAllUsers', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        { uuid: 'user1', firstName: 'John', surname: 'Doe' },
        { uuid: 'user2', firstName: 'Jane', surname: 'Smith' },
      ];

      mockUserService.findUsers.mockResolvedValue(mockUsers);

      const result = await controller.findAllUsers();

      expect(userService.findUsers).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'success',
        users: mockUsers,
      });
    });
  });

  describe('findUserById', () => {
    it('should return user by id successfully', async () => {
      const mockUser = {
        uuid: 'test-uuid',
        firstName: 'John',
        surname: 'Doe',
      };

      mockUserService.findUserById.mockResolvedValue(mockUser);

      const result = await controller.findUserById('test-uuid');

      expect(userService.findUserById).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual({
        status: 'success',
        user: mockUser,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockDeleteResult = { affected: 1 };

      mockUserService.deleteUser.mockResolvedValue(mockDeleteResult);

      const result = await controller.deleteUser('test-uuid');

      expect(userService.deleteUser).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual({
        status: 'success',
        deletedUser: mockDeleteResult,
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateDto: Partial<UpdateUserDTO> = {
        firstName: 'Updated John',
      };

      const mockUpdatedUser = {
        uuid: 'test-uuid',
        firstName: 'Updated John',
        surname: 'Doe',
      };

      mockUserService.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateUser('test-uuid', updateDto);

      expect(userService.updateUser).toHaveBeenCalledWith('test-uuid', updateDto);
      expect(result).toEqual({
        status: 'success',
        updatedUser: mockUpdatedUser,
      });
    });
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const taskDto: TaskDTO = {
        users_uuid: 'test-uuid',
        description: 'Test task description',
        statusTask: 0,
      };

      const mockTask = {
        id: 1,
        ...taskDto,
      };

      mockUserService.createTask.mockResolvedValue(mockTask);

      const result = await controller.createTask('test-uuid', taskDto);

      expect(userService.createTask).toHaveBeenCalledWith('test-uuid', taskDto);
      expect(result).toEqual({
        status: 'success',
        newTask: mockTask,
      });
    });
  });

  describe('getTasksByUserId', () => {
    it('should get tasks by user id successfully', async () => {
      const mockTasks = [
        { id: 1, description: 'Task 1', statusTask: 0 },
        { id: 2, description: 'Task 2', statusTask: 1 },
      ];

      mockUserService.getTasksByUserId.mockResolvedValue(mockTasks);

      const result = await controller.getTasksByUserId('test-uuid');

      expect(userService.getTasksByUserId).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual({
        status: 'success',
        tasks: mockTasks,
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const mockDeleteResult = { affected: 1 };

      mockUserService.deleteTask.mockResolvedValue(mockDeleteResult);

      const result = await controller.deleteTask(1);

      expect(userService.deleteTask).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        status: 'success',
        deleteTask: mockDeleteResult,
      });
    });
  });
});
