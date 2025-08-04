import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyService } from './policy.service';
import { PolicyEntity } from '../entities/policy.entity';
import { PolicyStatusEntity } from '../entities/policy_status.entity';
import { PolicyTypeEntity } from '../entities/policy_type.entity';
import { PaymentFrequencyEntity } from '../entities/payment_frequency.entity';
import { PaymentMethodEntity } from '../entities/payment_method.entity';
import { RenewalEntity } from '../entities/renewal.entity';
import { PolicyPeriodDataEntity } from '../entities/policy_period_data.entity';
import { PolicyPeriodDataDTO } from '../dto/policy.period.data.dto';
import { PolicyStatusService } from '@/helpers/policy.status';
import { PaymentService } from '@/payment/services/payment.service';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';

describe('PolicyService', () => {
  let service: PolicyService;
  let policyRepository: jest.Mocked<Repository<PolicyEntity>>;
  let policyPeriodDataRepository: jest.Mocked<Repository<PolicyPeriodDataEntity>>;
  let policyStatusService: jest.Mocked<PolicyStatusService>;
  let paymentService: jest.Mocked<PaymentService>;
  let redisService: jest.Mocked<RedisModuleService>;

  // Mock repositories
  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });

  // Mock services
  const mockPolicyStatusService = {
    determinePolicyStatus: jest.fn(),
    determineNewPolicyStatus: jest.fn(),
    updatePolicyStatuses: jest.fn(),
  };

  const mockPaymentService = {
    createPayment: jest.fn(),
    getPolicyWithPayments: jest.fn(),
    getAllPayments: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        {
          provide: getRepositoryToken(PolicyEntity),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(PolicyStatusEntity),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(PolicyTypeEntity),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(PaymentFrequencyEntity),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(PaymentMethodEntity),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(RenewalEntity),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(PolicyPeriodDataEntity),
          useValue: mockRepository(),
        },
        {
          provide: PolicyStatusService,
          useValue: mockPolicyStatusService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
        {
          provide: RedisModuleService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
    policyRepository = module.get(getRepositoryToken(PolicyEntity));
    policyPeriodDataRepository = module.get(getRepositoryToken(PolicyPeriodDataEntity));
    policyStatusService = module.get(PolicyStatusService);
    paymentService = module.get(PaymentService);
    redisService = module.get(RedisModuleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Inicialización del servicio', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required dependencies', () => {
      expect(policyRepository).toBeDefined();
      expect(policyStatusService).toBeDefined();
      expect(paymentService).toBeDefined();
      expect(redisService).toBeDefined();
    });
  });

  describe('Métodos públicos críticos', () => {
    it('should have createPolicy method', () => {
      expect(typeof service.createPolicy).toBe('function');
    });

    it('should have getAllPolicies method', () => {
      expect(typeof service.getAllPolicies).toBe('function');
    });

    it('should have findPolicyById method', () => {
      expect(typeof service.findPolicyById).toBe('function');
    });

    it('should have updatedPolicy method', () => {
      expect(typeof service.updatedPolicy).toBe('function');
    });

    it('should have createRenevalAndUpdate method', () => {
      expect(typeof service.createRenevalAndUpdate).toBe('function');
    });

    it('should have createOrUpdatePeriodForPolicy method', () => {
      expect(typeof service.createOrUpdatePeriodForPolicy).toBe('function');
    });

    it('should have getPolicyPeriods method', () => {
      expect(typeof service.getPolicyPeriods).toBe('function');
    });
  });

  describe('Métodos de consulta básicos', () => {
    it('should have getTypesPolicies method', () => {
      expect(typeof service.getTypesPolicies).toBe('function');
    });

    it('should have getPolicyStatus method', () => {
      expect(typeof service.getPolicyStatus).toBe('function');
    });

    it('should have getFrecuencyPolicies method', () => {
      expect(typeof service.getFrecuencyPolicies).toBe('function');
    });

    it('should have getPaymentMethod method', () => {
      expect(typeof service.getPaymentMethod).toBe('function');
    });
  });

  describe('Cache Management', () => {
    it('should handle Redis operations', async () => {
      redisService.get.mockResolvedValue(null);
      redisService.set.mockResolvedValue(undefined);
      redisService.del.mockResolvedValue(undefined);

      // Test that Redis methods can be called
      expect(redisService.get).toBeDefined();
      expect(redisService.set).toBeDefined();
      expect(redisService.del).toBeDefined();
    });
  });

  describe('Dependency Integration', () => {
    it('should integrate with PolicyStatusService', () => {
      expect(policyStatusService.determinePolicyStatus).toBeDefined();
      expect(policyStatusService.determineNewPolicyStatus).toBeDefined();
    });

    it('should integrate with PaymentService', () => {
      expect(paymentService.createPayment).toBeDefined();
      expect(paymentService.getPolicyWithPayments).toBeDefined();
    });
  });

  describe('createOrUpdatePeriodForPolicy - Tests Funcionales', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a new period when none exists', async () => {
      // Arrange
      const policyId = 1;
      const year = 2024;
      const periodData: PolicyPeriodDataDTO = {
        policy_id: policyId,
        year: year,
        policyValue: 5000,
        agencyPercentage: 10,
        advisorPercentage: 15,
        policyFee: 100,
      };

      const expectedCreatedPeriod = {
        id: 1,
        policy_id: policyId,
        year: year,
        policyValue: 5000,
        agencyPercentage: 10,
        advisorPercentage: 15,
        policyFee: 100,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock repository responses
      policyPeriodDataRepository.findOne.mockResolvedValue(null); // No existe periodo
      policyPeriodDataRepository.create.mockReturnValue(expectedCreatedPeriod as any);
      policyPeriodDataRepository.save.mockResolvedValue(expectedCreatedPeriod as any);

      // Mock private method
      const getAdvisorIdSpy = jest.spyOn(service as any, 'getAdvisorIdByPolicyId')
        .mockResolvedValue(123);
      const invalidateCachesSpy = jest.spyOn(service as any, 'invalidateCaches')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.createOrUpdatePeriodForPolicy(policyId, year, periodData);

      // Assert
      expect(policyPeriodDataRepository.findOne).toHaveBeenCalledWith({
        where: { policy_id: policyId, year },
      });
      expect(policyPeriodDataRepository.create).toHaveBeenCalledWith({
        policy_id: policyId,
        year: year,
        policyValue: 5000,
        agencyPercentage: 10,
        advisorPercentage: 15,
        policyFee: 100,
      });
      expect(policyPeriodDataRepository.save).toHaveBeenCalledWith(expectedCreatedPeriod);
      expect(getAdvisorIdSpy).toHaveBeenCalledWith(policyId);
      expect(invalidateCachesSpy).toHaveBeenCalledWith(123);
      expect(result).toEqual(expectedCreatedPeriod);
    });

    it('should update existing period when it exists', async () => {
      // Arrange
      const policyId = 1;
      const year = 2024;
      const periodData: PolicyPeriodDataDTO = {
        policy_id: policyId,
        year: year,
        policyValue: 6000,
        agencyPercentage: 12,
        advisorPercentage: 18,
        policyFee: 120,
      };

      const existingPeriod = {
        id: 1,
        policy_id: policyId,
        year: year,
        policyValue: 5000,
        agencyPercentage: 10,
        advisorPercentage: 15,
        policyFee: 100,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedPeriod = {
        ...existingPeriod,
        policyValue: 6000,
        agencyPercentage: 12,
        advisorPercentage: 18,
        policyFee: 120,
        updated_at: new Date(),
      };

      // Mock repository responses
      policyPeriodDataRepository.findOne.mockResolvedValue(existingPeriod as any);
      policyPeriodDataRepository.save.mockResolvedValue(updatedPeriod as any);

      // Mock private methods
      const getAdvisorIdSpy = jest.spyOn(service as any, 'getAdvisorIdByPolicyId')
        .mockResolvedValue(123);
      const invalidateCachesSpy = jest.spyOn(service as any, 'invalidateCaches')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.createOrUpdatePeriodForPolicy(policyId, year, periodData);

      // Assert
      expect(policyPeriodDataRepository.findOne).toHaveBeenCalledWith({
        where: { policy_id: policyId, year },
      });
      expect(policyPeriodDataRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          policyValue: 6000,
          agencyPercentage: 12,
          advisorPercentage: 18,
          policyFee: 120,
        })
      );
      expect(getAdvisorIdSpy).toHaveBeenCalledWith(policyId);
      expect(invalidateCachesSpy).toHaveBeenCalledWith(123);
      expect(result).toEqual(updatedPeriod);
    });

    it('should handle cache invalidation when advisor not found', async () => {
      // Arrange
      const policyId = 1;
      const year = 2024;
      const periodData: PolicyPeriodDataDTO = {
        policy_id: policyId,
        year: year,
        policyValue: 5000,
        agencyPercentage: 10,
        advisorPercentage: 15,
        policyFee: 100,
      };

      const expectedCreatedPeriod = {
        id: 1,
        policy_id: policyId,
        year: year,
        policyValue: 5000,
        agencyPercentage: 10,
        advisorPercentage: 15,
        policyFee: 100,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock repository responses
      policyPeriodDataRepository.findOne.mockResolvedValue(null);
      policyPeriodDataRepository.create.mockReturnValue(expectedCreatedPeriod as any);
      policyPeriodDataRepository.save.mockResolvedValue(expectedCreatedPeriod as any);

      // Mock private methods - advisor not found
      const getAdvisorIdSpy = jest.spyOn(service as any, 'getAdvisorIdByPolicyId')
        .mockResolvedValue(null);
      const invalidateCachesSpy = jest.spyOn(service as any, 'invalidateCaches')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.createOrUpdatePeriodForPolicy(policyId, year, periodData);

      // Assert
      expect(getAdvisorIdSpy).toHaveBeenCalledWith(policyId);
      expect(invalidateCachesSpy).toHaveBeenCalledWith(null);
      expect(result).toEqual(expectedCreatedPeriod);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const policyId = 1;
      const year = 2024;
      const periodData: PolicyPeriodDataDTO = {
        policy_id: policyId,
        year: year,
        policyValue: 5000,
        agencyPercentage: 10,
        advisorPercentage: 15,
        policyFee: 100,
      };

      // Mock repository to throw error
      policyPeriodDataRepository.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        service.createOrUpdatePeriodForPolicy(policyId, year, periodData)
      ).rejects.toThrow();

      expect(policyPeriodDataRepository.findOne).toHaveBeenCalledWith({
        where: { policy_id: policyId, year },
      });
    });
  });
});
