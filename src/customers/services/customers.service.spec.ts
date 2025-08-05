import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CustomersService } from './customers.service';
import { CustomersEntity } from '../entities/customer.entity';
import { CustomerDTO } from '../dto/customer.dto';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';

describe('CustomersService - AUDITORIA DE REGISTROS Y CONSULTAS BÁSICAS', () => {
  let service: CustomersService;
  let customerRepository: jest.Mocked<Repository<CustomersEntity>>;
  let redisService: jest.Mocked<RedisModuleService>;

  const mockCustomerData: CustomerDTO = {
    ci_ruc: '1234567890',
    firstName: 'juan',
    secondName: 'carlos',
    surname: 'perez',
    secondSurname: 'martinez',
    status_id: 1,
    birthdate: new Date('1990-01-01'),
    email: 'juan.perez@test.com',
    numberPhone: '0987654321',
    province_id: 1,
    city_id: 1,
    address: 'Av. Principal 123',
    personalData: true
  };

  const mockCustomerEntity: CustomersEntity = {
    id: 1,
    ci_ruc: '1234567890',
    firstName: 'JUAN',
    secondName: 'CARLOS',
    surname: 'PEREZ',
    secondSurname: 'MARTINEZ',
    status_id: 1,
    birthdate: new Date('1990-01-01'),
    email: 'juan.perez@test.com',
    numberPhone: '0987654321',
    province_id: 1,
    city_id: 1,
    address: 'Av. Principal 123',
    personalData: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    civil: { id: 1, status: 'SOLTERO' } as any,
    city: { id: 1, cityName: 'QUITO' } as any,
    province: { id: 1, provinceName: 'PICHINCHA' } as any,
    policies: [],
    customer: null,
    creditCards: [],
    bankAccount: []
  };

  beforeEach(async () => {
    const mockCustomerRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(CustomersEntity),
          useValue: mockCustomerRepository,
        },
        {
          provide: RedisModuleService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    customerRepository = module.get(getRepositoryToken(CustomersEntity));
    redisService = module.get(RedisModuleService);

    jest.clearAllMocks();
  });

  describe('Service Initialization & Configuration', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have repository and redis service injected', () => {
      expect(customerRepository).toBeDefined();
      expect(redisService).toBeDefined();
    });

    it('should extend ValidateEntity for data validation', () => {
      expect(service).toBeInstanceOf(CustomersService);
      expect(typeof (service as any).validateInput).toBe('function');
    });
  });

  describe('createCustomer - Registration Security Tests', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'validateInput').mockResolvedValue(undefined);
    });

    it('should create customer with proper data transformation', async () => {
      customerRepository.save.mockResolvedValue(mockCustomerEntity);
      redisService.del.mockResolvedValue(undefined);

      const result = await service.createCustomer(mockCustomerData);

      expect((service as any).validateInput).toHaveBeenCalledWith(mockCustomerData, 'customer');
      expect(customerRepository.save).toHaveBeenCalledWith({
        ...mockCustomerData,
        firstName: 'JUAN',
        secondName: 'CARLOS',
        surname: 'PEREZ',
        secondSurname: 'MARTINEZ'
      });
      expect(redisService.del).toHaveBeenCalledWith('customers');
      expect(result).toEqual(mockCustomerEntity);
    });

    it('should transform names to uppercase for data consistency', async () => {
      customerRepository.save.mockResolvedValue(mockCustomerEntity);
      
      const testData = {
        ...mockCustomerData,
        firstName: 'maría',
        secondName: 'josé',
        surname: 'garcía',
        secondSurname: 'lópez'
      };

      await service.createCustomer(testData);

      expect(customerRepository.save).toHaveBeenCalledWith({
        ...testData,
        firstName: 'MARÍA',
        secondName: 'JOSÉ',
        surname: 'GARCÍA',
        secondSurname: 'LÓPEZ'
      });
    });

    it('should handle validation errors gracefully', async () => {
      jest.spyOn(service as any, 'validateInput').mockRejectedValue(
        new Error('Email already exists')
      );

      await expect(service.createCustomer(mockCustomerData))
        .rejects
        .toThrow('Email already exists');

      expect(customerRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getAllCustomers - Data Retrieval & Cache Tests', () => {
    it('should return cached data when available', async () => {
      redisService.get.mockResolvedValue(JSON.stringify([mockCustomerEntity]));

      const result = await service.getAllCustomers();

      expect(redisService.get).toHaveBeenCalledWith('customers');
      expect(customerRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual([mockCustomerEntity]);
    });

    it('should fetch from database when cache is empty', async () => {
      redisService.get.mockResolvedValue(null);
      customerRepository.find.mockResolvedValue([mockCustomerEntity]);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.getAllCustomers();

      expect(redisService.get).toHaveBeenCalledWith('customers');
      expect(customerRepository.find).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        'customers',
        JSON.stringify([mockCustomerEntity]),
        32400
      );
      expect(result).toEqual([mockCustomerEntity]);
    });

    it('should implement proper search functionality', async () => {
      redisService.get.mockResolvedValue(null);
      customerRepository.find.mockResolvedValue([mockCustomerEntity]);
      redisService.set.mockResolvedValue(undefined);

      const searchTerm = 'juan';
      await service.getAllCustomers(searchTerm);

      const expectedSearchCondition = Like(`%${searchTerm}%`);
      expect(customerRepository.find).toHaveBeenCalledWith({
        order: { id: "DESC" },
        where: [
          { firstName: expectedSearchCondition },
          { surname: expectedSearchCondition },
          { ci_ruc: expectedSearchCondition },
          { secondSurname: expectedSearchCondition },
          { secondName: expectedSearchCondition },
        ],
        relations: ['civil', 'city', 'province', 'policies'],
        select: {
          civil: { id: true, status: true },
          city: { id: true, cityName: true },
          province: { id: true, provinceName: true },
        },
      });
    });

    it('should throw error when no customers found', async () => {
      redisService.get.mockResolvedValue(null);
      customerRepository.find.mockResolvedValue([]);

      await expect(service.getAllCustomers())
        .rejects
        .toThrow('No se encontró resultados');
    });

    it('should set appropriate TTL for cache (9 hours)', async () => {
      redisService.get.mockResolvedValue(null);
      customerRepository.find.mockResolvedValue([mockCustomerEntity]);
      redisService.set.mockResolvedValue(undefined);

      await service.getAllCustomers();

      expect(redisService.set).toHaveBeenCalledWith(
        'customers',
        JSON.stringify([mockCustomerEntity]),
        32400
      );
    });
  });

  describe('getCustomerById - Individual Customer Retrieval', () => {
    const customerId = 1;
    const cacheKey = `customer:${customerId}`;

    it('should return cached customer when available', async () => {
      redisService.get.mockResolvedValue(JSON.stringify(mockCustomerEntity));

      const result = await service.getCustomerById(customerId);

      expect(redisService.get).toHaveBeenCalledWith(cacheKey);
      expect(customerRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockCustomerEntity);
    });

    it('should fetch from database with comprehensive relations', async () => {
      redisService.get.mockResolvedValue(null);
      customerRepository.findOne.mockResolvedValue(mockCustomerEntity);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.getCustomerById(customerId);

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: customerId },
        relations: expect.arrayContaining([
          'civil', 'city', 'policies', 'province'
        ]),
        select: expect.any(Object)
      });
      expect(result).toEqual(mockCustomerEntity);
    });

    it('should throw error when customer not found', async () => {
      redisService.get.mockResolvedValue(null);
      customerRepository.findOne.mockResolvedValue(null);

      await expect(service.getCustomerById(customerId))
        .rejects
        .toThrow('No se encontró resultados');
    });
  });

  describe('updateCustomer - Data Update Security', () => {
    const customerId = 1;
    const updateData = {
      firstName: 'maria',
      surname: 'gonzalez',
      email: 'maria.gonzalez@test.com'
    };

    it('should update customer with proper data transformation', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomerEntity);
      
      const updatedCustomer = {
        ...mockCustomerEntity,
        firstName: 'MARIA',
        surname: 'GONZALEZ',
        email: 'maria.gonzalez@test.com'
      };
      
      customerRepository.save.mockResolvedValue(updatedCustomer);
      redisService.del.mockResolvedValue(undefined);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.updateCustomer(customerId, updateData);

      expect(customerRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedCustomer);
    });

    it('should throw error when customer not found for update', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(service.updateCustomer(customerId, updateData))
        .rejects
        .toThrow('No se encontró el cliente');

      expect(customerRepository.save).not.toHaveBeenCalled();
    });

    it('should invalidate cache after successful update', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomerEntity);
      const updatedCustomer = { ...mockCustomerEntity, ...updateData };
      customerRepository.save.mockResolvedValue(updatedCustomer);
      redisService.del.mockResolvedValue(undefined);
      redisService.set.mockResolvedValue(undefined);

      await service.updateCustomer(customerId, updateData);

      expect(redisService.del).toHaveBeenCalledWith(`customer:${customerId}`);
      expect(redisService.del).toHaveBeenCalledWith('customers');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle Redis connection failures gracefully', async () => {
      redisService.get.mockRejectedValue(new Error('Redis connection failed'));

      await expect(service.getAllCustomers())
        .rejects
        .toThrow('Redis connection failed');
    });

    it('should handle database connection failures', async () => {
      redisService.get.mockResolvedValue(null);
      customerRepository.find.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getAllCustomers())
        .rejects
        .toThrow('Database connection failed');
    });
  });

  describe('Data Privacy & Security Compliance', () => {
    it('should handle personal data with proper field selection', async () => {
      redisService.get.mockResolvedValue(null);
      customerRepository.find.mockResolvedValue([mockCustomerEntity]);
      redisService.set.mockResolvedValue(undefined);

      await service.getAllCustomers();

      const findCall = customerRepository.find.mock.calls[0][0];
      expect(findCall.select).toEqual({
        civil: { id: true, status: true },
        city: { id: true, cityName: true },
        province: { id: true, provinceName: true },
      });
    });

    it('should maintain data consistency with uppercase transformation', async () => {
      const testData = {
        ...mockCustomerData,
        firstName: 'josé maría',
        surname: 'garcía lópez'
      };

      customerRepository.save.mockResolvedValue(mockCustomerEntity);
      jest.spyOn(service as any, 'validateInput').mockResolvedValue(undefined);

      await service.createCustomer(testData);

      expect(customerRepository.save).toHaveBeenCalledWith({
        ...testData,
        firstName: 'JOSÉ MARÍA',
        surname: 'GARCÍA LÓPEZ'
      });
    });

    it('should include personal data consent validation', async () => {
      const dataWithConsent = { ...mockCustomerData, personalData: true };

      customerRepository.save.mockResolvedValue(mockCustomerEntity);
      jest.spyOn(service as any, 'validateInput').mockResolvedValue(undefined);

      await service.createCustomer(dataWithConsent);
      expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        personalData: true
      }));
    });
  });
});
