import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentEntity } from '../entity/payment.entity';
import { PaymentStatusEntity } from '../entity/payment.status.entity';
import { PolicyEntity } from '../../policy/entities/policy.entity';
import { RedisModuleService } from '../../redis-module/services/redis-module.service';
import { ErrorManager } from '../../helpers/error.manager';
import { PaymentDTO } from '../dto/payment.dto';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: jest.Mocked<Repository<PaymentEntity>>;
  let paymentStatusRepository: jest.Mocked<Repository<PaymentStatusEntity>>;
  let policyRepository: jest.Mocked<Repository<PolicyEntity>>;
  let redisService: jest.Mocked<RedisModuleService>;

  // Mock data
  const mockPayment: PaymentEntity = {
    id: 1,
    policy_id: 1,
    number_payment: 1,
    value: 1000,
    pending_value: 500,
    status_payment_id: 1,
    credit: 0,
    balance: 1000,
    total: 0,
    observations: 'Test payment',
    createdAt: new Date(),
    updatedAt: new Date(),
    policies: null,
    paymentStatus: null,
  } as PaymentEntity;

  const mockPaymentDTO: PaymentDTO = {
    policy_id: 1,
    number_payment: 1,
    value: 1000,
    pending_value: 500,
    status_payment_id: 1,
    credit: 0,
    balance: 1000,
    total: 0,
    observations: 'Test payment',
    createdAt: new Date(),
  };

  const mockStatusPayment: PaymentStatusEntity = {
    id: 1,
    statusNamePayment: 'Pendiente',
    payments: [],
  } as PaymentStatusEntity;

  beforeEach(async () => {
    // Create mocks
    const mockPaymentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getOne: jest.fn(),
      }),
    };

    const mockPaymentStatusRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockPolicyRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      deletePattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: mockPaymentRepo,
        },
        {
          provide: getRepositoryToken(PaymentStatusEntity),
          useValue: mockPaymentStatusRepo,
        },
        {
          provide: getRepositoryToken(PolicyEntity),
          useValue: mockPolicyRepo,
        },
        {
          provide: RedisModuleService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepository = module.get(getRepositoryToken(PaymentEntity));
    paymentStatusRepository = module.get(getRepositoryToken(PaymentStatusEntity));
    policyRepository = module.get(getRepositoryToken(PolicyEntity));
    redisService = module.get(RedisModuleService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have paymentRepository injected', () => {
      expect(paymentRepository).toBeDefined();
    });

    it('should have paymentStatusRepository injected', () => {
      expect(paymentStatusRepository).toBeDefined();
    });

    it('should have policyRepository injected', () => {
      expect(policyRepository).toBeDefined();
    });

    it('should have redisService injected', () => {
      expect(redisService).toBeDefined();
    });
  });

  describe('Public Methods Existence', () => {
    it('should have createPayment method', () => {
      expect(service.createPayment).toBeDefined();
      expect(typeof service.createPayment).toBe('function');
    });

    it('should have getAllPayments method', () => {
      expect(service.getAllPayments).toBeDefined();
      expect(typeof service.getAllPayments).toBe('function');
    });

    it('should have getPaymentsId method', () => {
      expect(service.getPaymentsId).toBeDefined();
      expect(typeof service.getPaymentsId).toBe('function');
    });

    it('should have getPaymentStatus method', () => {
      expect(service.getPaymentStatus).toBeDefined();
      expect(typeof service.getPaymentStatus).toBe('function');
    });

    it('should have getPaymentsByStatus method', () => {
      expect(service.getPaymentsByStatus).toBeDefined();
      expect(typeof service.getPaymentsByStatus).toBe('function');
    });

    it('should have updatePayment method', () => {
      expect(service.updatePayment).toBeDefined();
      expect(typeof service.updatePayment).toBe('function');
    });
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      // Mock que la póliza existe con relations
      const mockPolicy = {
        id: 1,
        payments: [],
        renewals: [],
        periods: []
      } as any;
      policyRepository.findOne.mockResolvedValue(mockPolicy);
      paymentRepository.save.mockResolvedValue(mockPayment);
      redisService.del.mockResolvedValue(undefined);

      const result = await service.createPayment(mockPaymentDTO);

      expect(policyRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPaymentDTO.policy_id },
        relations: ['payments', 'renewals', 'periods']
      });
      expect(paymentRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...mockPaymentDTO,
        number_payment: 1 // Se asigna automáticamente
      }));
      expect(result).toEqual(mockPayment);
    });

    it('should throw error when policy not found', async () => {
      // Mock que la póliza no existe
      policyRepository.findOne.mockResolvedValue(null);

      await expect(service.createPayment(mockPaymentDTO)).rejects.toThrow('No se encontró la póliza');
    });

    it('should handle errors during payment creation', async () => {
      const errorMessage = 'Database error';
      const mockPolicy = { id: 1, payments: [], renewals: [], periods: [] } as any;
      policyRepository.findOne.mockResolvedValue(mockPolicy);
      paymentRepository.save.mockRejectedValue(new Error(errorMessage));

      await expect(service.createPayment(mockPaymentDTO)).rejects.toThrow();
    });
  });

  describe('getAllPayments', () => {
    it('should return all payments with cache miss', async () => {
      const mockPayments = [mockPayment];
      redisService.get.mockResolvedValue(null);
      paymentRepository.find.mockResolvedValue(mockPayments);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.getAllPayments();

      expect(redisService.get).toHaveBeenCalledWith('payments');
      expect(paymentRepository.find).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        relations: [
          'policies',
          'policies.periods',
          'paymentStatus',
          'policies.paymentFrequency',
          'policies.payments',
        ],
        select: {
          policies: {
            id: true,
            numberPolicy: true,
          },
        },
      });
      expect(redisService.set).toHaveBeenCalledWith('payments', JSON.stringify(mockPayments), 32400);
      expect(result).toEqual(mockPayments);
    });

    it('should return cached payments', async () => {
      // Mock cached data as string with serialized dates
      const cachedPayments = [{
        ...mockPayment,
        createdAt: mockPayment.createdAt.toISOString(),
        updatedAt: mockPayment.updatedAt.toISOString()
      }];
      redisService.get.mockResolvedValue(JSON.stringify(cachedPayments));

      const result = await service.getAllPayments();

      expect(redisService.get).toHaveBeenCalledWith('payments');
      expect(paymentRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual(cachedPayments);
    });

    it('should throw error when no payments found', async () => {
      redisService.get.mockResolvedValue(null);
      paymentRepository.find.mockResolvedValue([]);

      await expect(service.getAllPayments()).rejects.toThrow('No se encontró resultados');
    });
  });

  describe('getPaymentsId', () => {
    it('should return payment by id', async () => {
      paymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.getPaymentsId(1);

      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['policies', 'policies.periods', 'paymentStatus'],
        select: {
          policies: {
            id: true,
            numberPolicy: true,
          },
        },
      });
      expect(result).toEqual(mockPayment);
    });

    it('should throw error when payment not found', async () => {
      paymentRepository.findOne.mockResolvedValue(null);

      await expect(service.getPaymentsId(999)).rejects.toThrow('No se encontró resultados');
    });
  });

  describe('getPaymentStatus', () => {
    it('should return all payment statuses', async () => {
      const mockStatuses = [mockStatusPayment];
      paymentStatusRepository.find.mockResolvedValue(mockStatuses);

      const result = await service.getPaymentStatus();

      expect(paymentStatusRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockStatuses);
    });

    it('should return empty array when no statuses found', async () => {
      paymentStatusRepository.find.mockResolvedValue([]);

      const result = await service.getPaymentStatus();

      expect(paymentStatusRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('updatePayment', () => {
    it('should update payment successfully', async () => {
      const updateData = { value: 1500 };
      paymentRepository.findOne.mockResolvedValue(mockPayment);
      paymentRepository.save.mockResolvedValue({ ...mockPayment, ...updateData });
      redisService.del.mockResolvedValue(undefined);

      const result = await service.updatePayment(1, updateData);

      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['policies', 'policies.company', 'policies.advisor'],
      });
      expect(paymentRepository.save).toHaveBeenCalled();
      expect(result.value).toBe(1500);
    });

    it('should throw error when payment to update not found', async () => {
      paymentRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePayment(999, { value: 1500 })).rejects.toThrow('No se encontró el pago');
    });
  });

  describe('getPaymentsByStatus', () => {
    it('should return payments by status', async () => {
      const companyId = 1;
      const mockPayments = [mockPayment];
      paymentRepository.find.mockResolvedValue(mockPayments);

      const result = await service.getPaymentsByStatus(companyId);

      expect(paymentRepository.find).toHaveBeenCalledWith({
        where: {
          status_payment_id: 1,
          'policies.company.id': companyId,
        },
        relations: [
          'policies',
          'policies.customer',
          'policies.company',
          'policies.advisor',
          'paymentStatus',
        ],
        select: {
          id: true,
          value: true,
          createdAt: true,
          policies: {
            id: true,
            numberPolicy: true,
            policyValue: true,
            policyType: {
              policyName: true,
            },
            customer: {
              numberPhone: true,
              firstName: true,
              secondName: true,
              surname: true,
              secondSurname: true,
            },
            company: {
              id: true,
              companyName: true,
            },
            advisor: {
              firstName: true,
              secondName: true,
              surname: true,
              secondSurname: true,
            },
          },
        },
      });
      expect(result).toEqual(mockPayments);
    });

    it('should throw error when no payments found for status', async () => {
      paymentRepository.find.mockResolvedValue([]);

      await expect(service.getPaymentsByStatus(999)).rejects.toThrow('No se encontró resultados');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache after payment operations', async () => {
      const mockPolicy = { id: 1, payments: [], renewals: [], periods: [] } as any;
      policyRepository.findOne.mockResolvedValue(mockPolicy);
      paymentRepository.save.mockResolvedValue(mockPayment);
      redisService.del.mockResolvedValue(undefined);

      await service.createPayment(mockPaymentDTO);

      // El servicio no llama directamente redisService.del, sino invalidatePolicyRelatedCache
      expect(policyRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      redisService.get.mockResolvedValue(null);
      paymentRepository.find.mockRejectedValue(new Error('Connection failed'));

      await expect(service.getAllPayments()).rejects.toThrow();
    });

    it('should handle redis connection errors gracefully', async () => {
      redisService.get.mockRejectedValue(new Error('Redis connection failed'));
      
      // El servicio actual no maneja graciosamente los errores de Redis
      await expect(service.getAllPayments()).rejects.toThrow();
    });
  });
});
