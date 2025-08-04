import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsPaymentsService } from './commissions-payments.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommissionsPaymentsEntity } from '../entities/CommissionsPayments.entity';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { CommissionRefundsEntity } from '../entities/CommissionRefunds.entity';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CacheKeys } from '@/constants/cache.enum';
import { ErrorManager } from '@/helpers/error.manager';
import { DateHelper } from '@/helpers/date.helper';
import { CommissionsDTO } from '../dto/Commissions.dto';
import { CommissionRefundsDTO } from '../dto/CommissionRefunds.dto';

describe('CommissionsPaymentsService - AUDITORIA COMPLETA', () => {
  let service: CommissionsPaymentsService;
  let commissionsPaymentsRepository: jest.Mocked<Repository<CommissionsPaymentsEntity>>;
  let policyRepository: jest.Mocked<Repository<PolicyEntity>>;
  let commissionRefundsRepository: jest.Mocked<Repository<CommissionRefundsEntity>>;
  let redisService: jest.Mocked<RedisModuleService>;

  const mockCommissionPayment = {
    id: 1,
    receiptNumber: 'RCP-001',
    advanceAmount: 1000,
    createdAt: new Date('2023-01-01'),
    observations: 'Test payment',
    advisor_id: 1,
    policy_id: 1,
    payment_method_id: 1,
    company_id: 1,
    status_advance_id: null,
  };

  const mockPolicy = {
    id: 1,
    isCommissionAnnualized: false,
    paymentsToAdvisor: 2000,
    renewals: [],
    payments: [
      { status_payment_id: 2, value: 1500 },
      { status_payment_id: 1, value: 1000 }
    ],
    commissions: [
      { status_advance_id: null, advanceAmount: 500 },
      { status_advance_id: 1, advanceAmount: 300 }
    ]
  };

  const mockRefund = {
    id: 1,
    advisor_id: 1,
    policy_id: 1,
    amountRefunds: 500, // Corrección: debe ser amountRefunds según el DTO
    cancellationDate: new Date('2023-01-01'),
    reason: 'Policy cancellation'
  };

  beforeEach(async () => {
    const mockCommissionsRepository = {
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };

    const mockPolicyRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockRefundsRepository = {
      save: jest.fn(),
      find: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsPaymentsService,
        {
          provide: getRepositoryToken(CommissionsPaymentsEntity),
          useValue: mockCommissionsRepository,
        },
        {
          provide: getRepositoryToken(PolicyEntity),
          useValue: mockPolicyRepository,
        },
        {
          provide: getRepositoryToken(CommissionRefundsEntity),
          useValue: mockRefundsRepository,
        },
        {
          provide: RedisModuleService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<CommissionsPaymentsService>(CommissionsPaymentsService);
    commissionsPaymentsRepository = module.get(getRepositoryToken(CommissionsPaymentsEntity));
    policyRepository = module.get(getRepositoryToken(PolicyEntity));
    commissionRefundsRepository = module.get(getRepositoryToken(CommissionRefundsEntity));
    redisService = module.get(RedisModuleService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all repositories injected', () => {
      expect(commissionsPaymentsRepository).toBeDefined();
      expect(policyRepository).toBeDefined();
      expect(commissionRefundsRepository).toBeDefined();
      expect(redisService).toBeDefined();
    });
  });

  describe('createCommissionsPayments', () => {
    const validCommissionDTO: CommissionsDTO = {
      receiptNumber: 'RCP-001',
      advanceAmount: 1000,
      createdAt: new Date('2023-01-01'),
      observations: 'Test payment',
      advisor_id: 1,
      policy_id: [1], // Corrección: debe ser number[]
      payment_method_id: 1,
      company_id: 1,
      status_advance_id: null,
    };

    beforeEach(() => {
      jest.spyOn(DateHelper, 'normalizeDateForDB').mockReturnValue(new Date('2023-01-01'));
    });

    it('should create commission payment with valid policy_id', async () => {
      commissionsPaymentsRepository.save.mockResolvedValue(mockCommissionPayment as any);

      const result = await service.createCommissionsPayments(validCommissionDTO);

      expect(commissionsPaymentsRepository.save).toHaveBeenCalledWith({
        ...validCommissionDTO,
        createdAt: new Date('2023-01-01'),
        company_id: 1,
        policy_id: 1,
        status_advance_id: null, // Comisión pagada
      });
      expect(result).toEqual(mockCommissionPayment);
    });

    it('should create general advance when policy_id is null', async () => {
      const generalAdvanceDTO = { ...validCommissionDTO, policy_id: null };
      commissionsPaymentsRepository.save.mockResolvedValue({ ...mockCommissionPayment, policy_id: null } as any);

      const result = await service.createCommissionsPayments(generalAdvanceDTO);

      expect(commissionsPaymentsRepository.save).toHaveBeenCalledWith({
        ...generalAdvanceDTO,
        createdAt: new Date('2023-01-01'),
        company_id: 1,
        policy_id: null,
        status_advance_id: 1, // Anticipo general
      });
    });

    it('should normalize string policy_id to number', async () => {
      const stringPolicyDTO = { ...validCommissionDTO, policy_id: '5' as any };
      commissionsPaymentsRepository.save.mockResolvedValue(mockCommissionPayment as any);

      await service.createCommissionsPayments(stringPolicyDTO);

      expect(commissionsPaymentsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          policy_id: 5,
          status_advance_id: null,
        })
      );
    });

    it('should handle invalid policy_id strings', async () => {
      const invalidPolicyDTO = { ...validCommissionDTO, policy_id: 'invalid' as any };
      commissionsPaymentsRepository.save.mockResolvedValue(mockCommissionPayment as any);

      await service.createCommissionsPayments(invalidPolicyDTO);

      expect(commissionsPaymentsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          policy_id: null,
          status_advance_id: 1, // Anticipo general al ser null
        })
      );
    });

    it('should handle negative policy_id', async () => {
      const negativePolicyDTO = { ...validCommissionDTO, policy_id: [-1] }; // Corrección: debe ser number[]
      commissionsPaymentsRepository.save.mockResolvedValue(mockCommissionPayment as any);

      await service.createCommissionsPayments(negativePolicyDTO);

      expect(commissionsPaymentsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          policy_id: null,
          status_advance_id: 1,
        })
      );
    });

    it('should clear cache after creation', async () => {
      commissionsPaymentsRepository.save.mockResolvedValue(mockCommissionPayment as any);

      await service.createCommissionsPayments(validCommissionDTO);

      expect(redisService.del).toHaveBeenCalledWith(CacheKeys.GLOBAL_COMMISSIONS);
      expect(redisService.del).toHaveBeenCalledWith(`advisor:${validCommissionDTO.advisor_id}`);
      expect(redisService.del).toHaveBeenCalledWith('allAdvisors');
    });

    it('should throw error on repository failure', async () => {
      const dbError = new Error('Database connection failed');
      commissionsPaymentsRepository.save.mockRejectedValue(dbError);

      await expect(service.createCommissionsPayments(validCommissionDTO))
        .rejects
        .toThrow('Database connection failed');
    });

    it('should handle company_id normalization', async () => {
      const noCompanyDTO = { ...validCommissionDTO, company_id: undefined };
      commissionsPaymentsRepository.save.mockResolvedValue(mockCommissionPayment as any);

      await service.createCommissionsPayments(noCompanyDTO);

      expect(commissionsPaymentsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: null,
        })
      );
    });
  });

  describe('getAllCommissions - Cache Management', () => {
    const mockCommissions = [mockCommissionPayment];

    it('should return cached data when available', async () => {
      redisService.get.mockResolvedValue(JSON.stringify(mockCommissions));

      const result = await service.getAllCommissions();

      expect(redisService.get).toHaveBeenCalledWith(CacheKeys.GLOBAL_COMMISSIONS);
      expect(commissionsPaymentsRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual(mockCommissions);
    });

    it('should fetch from database and cache when cache miss', async () => {
      redisService.get.mockResolvedValue(null);
      commissionsPaymentsRepository.find.mockResolvedValue(mockCommissions as any);

      const result = await service.getAllCommissions();

      expect(commissionsPaymentsRepository.find).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        CacheKeys.GLOBAL_COMMISSIONS,
        JSON.stringify(mockCommissions),
        3600
      );
      expect(result).toEqual(mockCommissions);
    });

    it('should handle empty cache gracefully', async () => {
      redisService.get.mockResolvedValue('');
      commissionsPaymentsRepository.find.mockResolvedValue(mockCommissions as any);

      const result = await service.getAllCommissions();

      expect(commissionsPaymentsRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockCommissions);
    });

    it('should handle cache parsing errors', async () => {
      redisService.get.mockResolvedValue('invalid-json');
      commissionsPaymentsRepository.find.mockResolvedValue(mockCommissions as any);

      await expect(service.getAllCommissions()).rejects.toThrow();
    });

    it('should handle database errors', async () => {
      redisService.get.mockResolvedValue(null);
      const dbError = new Error('Database connection failed');
      commissionsPaymentsRepository.find.mockRejectedValue(dbError);

      await expect(service.getAllCommissions()).rejects.toThrow('Database connection failed');
    });
  });

  describe('liquidateAdvancesIfNeeded', () => {
    const advisorId = 1;

    it('should liquidate advances when conditions are met', async () => {
      const advances = [
        { id: 1, advisor_id: advisorId, advanceAmount: 500, status_advance_id: 1 },
        { id: 2, advisor_id: advisorId, advanceAmount: 300, status_advance_id: 1 }
      ];
      const paidCommissions = [
        { id: 3, advisor_id: advisorId, advanceAmount: 1000, status_advance_id: null }
      ];

      commissionsPaymentsRepository.find
        .mockResolvedValueOnce(advances as any)
        .mockResolvedValueOnce(paidCommissions as any);

      await service.liquidateAdvancesIfNeeded(advisorId);

      expect(commissionsPaymentsRepository.update).toHaveBeenCalledWith(
        { advisor_id: advisorId, status_advance_id: 1 },
        { status_advance_id: 2 }
      );
    });

    it('should not liquidate when insufficient commissions', async () => {
      const advances = [
        { id: 1, advisor_id: advisorId, advanceAmount: 1000, status_advance_id: 1 }
      ];
      const paidCommissions = [
        { id: 2, advisor_id: advisorId, advanceAmount: 500, status_advance_id: null }
      ];

      commissionsPaymentsRepository.find
        .mockResolvedValueOnce(advances as any)
        .mockResolvedValueOnce(paidCommissions as any);

      await service.liquidateAdvancesIfNeeded(advisorId);

      expect(commissionsPaymentsRepository.update).not.toHaveBeenCalled();
    });

    it('should not liquidate when no advances exist', async () => {
      commissionsPaymentsRepository.find
        .mockResolvedValueOnce([]) // No advances
        .mockResolvedValueOnce([{ id: 1, advanceAmount: 1000 }] as any);

      await service.liquidateAdvancesIfNeeded(advisorId);

      expect(commissionsPaymentsRepository.update).not.toHaveBeenCalled();
    });

    it('should handle exact amount match', async () => {
      const advances = [
        { id: 1, advisor_id: advisorId, advanceAmount: 1000, status_advance_id: 1 }
      ];
      const paidCommissions = [
        { id: 2, advisor_id: advisorId, advanceAmount: 1000, status_advance_id: null }
      ];

      commissionsPaymentsRepository.find
        .mockResolvedValueOnce(advances as any)
        .mockResolvedValueOnce(paidCommissions as any);

      await service.liquidateAdvancesIfNeeded(advisorId);

      expect(commissionsPaymentsRepository.update).toHaveBeenCalledWith(
        { advisor_id: advisorId, status_advance_id: 1 },
        { status_advance_id: 2 }
      );
    });
  });

  describe('createCommissionRefunds', () => {
    const validRefundDTO: CommissionRefundsDTO = {
      advisor_id: 1,
      policy_id: 1,
      amountRefunds: 500, // Corrección: debe ser amountRefunds según el DTO
      cancellationDate: new Date('2023-01-01'),
      reason: 'Policy cancellation'
    };

    beforeEach(() => {
      jest.spyOn(DateHelper, 'normalizeDateForDB').mockReturnValue(new Date('2023-01-01'));
    });

    it('should create commission refund successfully', async () => {
      commissionRefundsRepository.save.mockResolvedValue(mockRefund as any);

      const result = await service.createCommissionRefunds(validRefundDTO);

      expect(commissionRefundsRepository.save).toHaveBeenCalledWith({
        ...validRefundDTO,
        cancellationDate: new Date('2023-01-01'),
      });
      expect(result).toEqual(mockRefund);
    });

    it('should clear all relevant cache after refund creation', async () => {
      commissionRefundsRepository.save.mockResolvedValue(mockRefund as any);

      await service.createCommissionRefunds(validRefundDTO);

      expect(redisService.del).toHaveBeenCalledWith('allAdvisors');
      expect(redisService.del).toHaveBeenCalledWith(CacheKeys.GLOBAL_COMMISSIONS);
      expect(redisService.del).toHaveBeenCalledWith(CacheKeys.GLOBAL_ALL_POLICIES);
      expect(redisService.del).toHaveBeenCalledWith(CacheKeys.GLOBAL_COMMISSION_REFUNDS);
      expect(redisService.del).toHaveBeenCalledWith('policies');
      expect(redisService.del).toHaveBeenCalledWith(`advisor:${validRefundDTO.advisor_id}`);
    });

    it('should handle refund creation failure', async () => {
      const dbError = new Error('Refund creation failed');
      commissionRefundsRepository.save.mockRejectedValue(dbError);

      await expect(service.createCommissionRefunds(validRefundDTO))
        .rejects
        .toThrow('Refund creation failed');
    });
  });

  describe('applyAdvanceDistribution - Business Logic Critical', () => {
    const mockAdvanceDistributionDTO = {
      advisor_id: 1,
      receiptNumber: 'RCP-001',
      createdAt: '2023-01-01',
      observations: 'Test distribution',
      payment_method_id: 1,
      policies: [
        { policy_id: 1, released_commission: 2000, advance_to_apply: 500 },
        { policy_id: 2, released_commission: 1500, advance_to_apply: 300 }
      ]
    };

    const mockPolicies = [
      {
        id: 1,
        isCommissionAnnualized: false,
        renewals: [],
        payments: [{ status_payment_id: 2, value: 2000 }],
        commissions: [{ status_advance_id: null, advanceAmount: 200 }]
      },
      {
        id: 2,
        isCommissionAnnualized: false,
        renewals: [],
        payments: [{ status_payment_id: 2, value: 1500 }],
        commissions: []
      }
    ];

    const mockGeneralAdvances = [
      { id: 1, advisor_id: 1, policy_id: null, status_advance_id: 1, advanceAmount: 1000 }
    ];

    beforeEach(() => {
      policyRepository.find.mockResolvedValue(mockPolicies as any);
      commissionsPaymentsRepository.find.mockResolvedValue(mockGeneralAdvances as any);
      commissionsPaymentsRepository.create.mockImplementation((data) => data as any);
      commissionsPaymentsRepository.save.mockResolvedValue({} as any);
      commissionsPaymentsRepository.update.mockResolvedValue({} as any);
    });

    it('should apply advance distribution successfully', async () => {
      const result = await service.applyAdvanceDistribution(mockAdvanceDistributionDTO);

      expect(result.status).toBe('success');
      expect(result.message).toBe('Payments applied successfully');
      expect(result.applied).toHaveLength(4); // 2 from general + 2 manual
    });

    it('should handle annualized commission calculation', async () => {
      const annualizedPolicy = {
        ...mockPolicies[0],
        isCommissionAnnualized: true,
        paymentsToAdvisor: 1000,
        renewals: [{ id: 1 }, { id: 2 }] // 2 renewals
      };
      policyRepository.find.mockResolvedValue([annualizedPolicy] as any);

      const singlePolicyDTO = {
        ...mockAdvanceDistributionDTO,
        policies: [{ policy_id: 1, released_commission: 3000, advance_to_apply: 500 }]
      };

      const result = await service.applyAdvanceDistribution(singlePolicyDTO);

      expect(result.status).toBe('success');
      // Should calculate: 1000 * (2 renewals + 1) = 3000 released commission
    });

    it('should throw error when applying more than available balance', async () => {
      const excessiveDTO = {
        ...mockAdvanceDistributionDTO,
        policies: [{ policy_id: 1, released_commission: 2000, advance_to_apply: 3000 }]
      };

      await expect(service.applyAdvanceDistribution(excessiveDTO))
        .rejects
        .toThrow('Cannot apply $3000 to policy 1');
    });

    it('should clear cache after distribution', async () => {
      await service.applyAdvanceDistribution(mockAdvanceDistributionDTO);

      expect(redisService.del).toHaveBeenCalledWith(CacheKeys.GLOBAL_COMMISSIONS);
      expect(redisService.del).toHaveBeenCalledWith(`advisor:${mockAdvanceDistributionDTO.advisor_id}`);
      expect(redisService.del).toHaveBeenCalledWith('allAdvisors');
    });

    it('should handle empty general advances', async () => {
      commissionsPaymentsRepository.find.mockResolvedValue([]); // No general advances

      const result = await service.applyAdvanceDistribution(mockAdvanceDistributionDTO);

      expect(result.status).toBe('success');
      expect(commissionsPaymentsRepository.save).toHaveBeenCalledTimes(2); // Only manual payments
    });

    it('should liquidate general advances when fully used', async () => {
      const smallGeneralAdvance = [
        { id: 1, advisor_id: 1, policy_id: null, status_advance_id: 1, advanceAmount: 100 }
      ];
      commissionsPaymentsRepository.find.mockResolvedValue(smallGeneralAdvance as any);

      await service.applyAdvanceDistribution(mockAdvanceDistributionDTO);

      expect(commissionsPaymentsRepository.update).toHaveBeenCalledWith(
        { id: expect.any(Array) },
        { status_advance_id: 2 }
      );
    });
  });

  describe('distributeGeneralAdvanceToPolicies - Algorithm Testing', () => {
    it('should distribute advances to policies with highest pending commission first', () => {
      const policies = [
        { id: 1, releasedCommission: 1000, paidCommission: 200 }, // 800 pending
        { id: 2, releasedCommission: 2000, paidCommission: 500 }, // 1500 pending  
        { id: 3, releasedCommission: 500, paidCommission: 100 },  // 400 pending
      ];
      const generalAdvance = 1000;

      const result = service['distributeGeneralAdvanceToPolicies'](policies, generalAdvance);

      expect(result[2]).toBe(1000); // Policy 2 gets all advance (highest pending)
      expect(result[1]).toBe(0);
      expect(result[3]).toBe(0);
    });

    it('should distribute across multiple policies when needed', () => {
      const policies = [
        { id: 1, releasedCommission: 1000, paidCommission: 500 }, // 500 pending
        { id: 2, releasedCommission: 1000, paidCommission: 200 }, // 800 pending
      ];
      const generalAdvance = 1000;

      const result = service['distributeGeneralAdvanceToPolicies'](policies, generalAdvance);

      expect(result[2]).toBe(800); // Policy 2 gets 800 (all its pending)
      expect(result[1]).toBe(200); // Policy 1 gets remaining 200
    });

    it('should handle policies with no pending commission', () => {
      const policies = [
        { id: 1, releasedCommission: 1000, paidCommission: 1000 }, // 0 pending
        { id: 2, releasedCommission: 500, paidCommission: 200 },   // 300 pending
      ];
      const generalAdvance = 1000;

      const result = service['distributeGeneralAdvanceToPolicies'](policies, generalAdvance);

      expect(result[1]).toBe(0);
      expect(result[2]).toBe(300); // Only what's pending
    });

    it('should handle zero general advance', () => {
      const policies = [
        { id: 1, releasedCommission: 1000, paidCommission: 200 },
      ];
      const generalAdvance = 0;

      const result = service['distributeGeneralAdvanceToPolicies'](policies, generalAdvance);

      expect(result[1]).toBe(0);
    });

    it('should handle empty policies array', () => {
      const policies = [];
      const generalAdvance = 1000;

      const result = service['distributeGeneralAdvanceToPolicies'](policies, generalAdvance);

      expect(result).toEqual({});
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      await expect(service.createCommissionsPayments(null as any))
        .rejects
        .toThrow();
    });

    it('should handle malformed policy data', async () => {
      const malformedDTO = {
        advisor_id: 1,
        receiptNumber: 'RCP-001',
        createdAt: '2023-01-01',
        payment_method_id: 1,
        policies: [
          { policy_id: null, released_commission: null, advance_to_apply: 500 }
        ]
      };

      policyRepository.find.mockResolvedValue([]);

      await expect(service.applyAdvanceDistribution(malformedDTO as any))
        .rejects
        .toThrow();
    });

    it('should handle database transaction failures', async () => {
      const validDTO: CommissionsDTO = {
        receiptNumber: 'RCP-001',
        advanceAmount: 1000,
        createdAt: new Date('2023-01-01'),
        advisor_id: 1,
        policy_id: [1], // Corrección: debe ser number[]
        payment_method_id: 1,
      };

      commissionsPaymentsRepository.save.mockRejectedValue(new Error('Transaction failed'));

      await expect(service.createCommissionsPayments(validDTO))
        .rejects
        .toThrow('Transaction failed');
    });

    it('should handle Redis cache failures gracefully', async () => {
      redisService.del.mockRejectedValue(new Error('Redis connection failed'));
      commissionsPaymentsRepository.save.mockResolvedValue(mockCommissionPayment as any);

      const validDTO: CommissionsDTO = {
        receiptNumber: 'RCP-001',
        advanceAmount: 1000,
        createdAt: new Date('2023-01-01'),
        advisor_id: 1,
        policy_id: [1], // Corrección: debe ser number[]
        payment_method_id: 1,
      };

      // Should still complete despite cache failure
      await expect(service.createCommissionsPayments(validDTO))
        .rejects
        .toThrow('Redis connection failed');
    });
  });

  describe('Performance & Concurrency Tests', () => {
    it('should handle multiple concurrent commission creations', async () => {
      const validDTO: CommissionsDTO = {
        receiptNumber: 'RCP-001',
        advanceAmount: 1000,
        createdAt: new Date('2023-01-01'),
        advisor_id: 1,
        policy_id: [1], // Corrección: debe ser number[]
        payment_method_id: 1,
      };

      commissionsPaymentsRepository.save.mockResolvedValue(mockCommissionPayment as any);

      const promises = Array(10).fill(0).map(() => 
        service.createCommissionsPayments({ ...validDTO, receiptNumber: `RCP-${Math.random()}` })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(commissionsPaymentsRepository.save).toHaveBeenCalledTimes(10);
    });

    it('should handle large policy datasets efficiently', async () => {
      const largePolicySet = Array(100).fill(0).map((_, i) => ({
        policy_id: i + 1,
        released_commission: 1000,
        advance_to_apply: 100
      }));

      const largeDistributionDTO = {
        advisor_id: 1,
        receiptNumber: 'RCP-LARGE',
        createdAt: '2023-01-01',
        payment_method_id: 1,
        policies: largePolicySet
      };

      const mockLargePolicies = largePolicySet.map((p, i) => ({
        id: i + 1,
        isCommissionAnnualized: false,
        renewals: [],
        payments: [{ status_payment_id: 2, value: 1000 }],
        commissions: []
      }));

      policyRepository.find.mockResolvedValue(mockLargePolicies as any);
      commissionsPaymentsRepository.find.mockResolvedValue([]);

      const startTime = Date.now();
      const result = await service.applyAdvanceDistribution(largeDistributionDTO);
      const endTime = Date.now();

      expect(result.status).toBe('success');
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Integration Tests', () => {
    it('should complete full commission lifecycle', async () => {
      // 1. Create general advance
      const generalAdvanceDTO: CommissionsDTO = {
        receiptNumber: 'ADV-001',
        advanceAmount: 1000,
        createdAt: new Date('2023-01-01'),
        advisor_id: 1,
        policy_id: null, // null está permitido según el DTO
        payment_method_id: 1,
      };

      commissionsPaymentsRepository.save.mockResolvedValue({ ...mockCommissionPayment, policy_id: null, status_advance_id: 1 } as any);

      const advance = await service.createCommissionsPayments(generalAdvanceDTO);
      expect(advance.status_advance_id).toBe(1);

      // 2. Apply distribution
      const distributionDTO = {
        advisor_id: 1,
        receiptNumber: 'RCP-001',
        createdAt: '2023-01-01',
        payment_method_id: 1,
        policies: [{ policy_id: 1, released_commission: 2000, advance_to_apply: 500 }]
      };

      policyRepository.find.mockResolvedValue([mockPolicy] as any);
      commissionsPaymentsRepository.find.mockResolvedValue([{ id: 1, advisor_id: 1, policy_id: null, status_advance_id: 1, advanceAmount: 1000 }] as any);

      const distribution = await service.applyAdvanceDistribution(distributionDTO);
      expect(distribution.status).toBe('success');

      // 3. Verify cache invalidation
      expect(redisService.del).toHaveBeenCalledWith(CacheKeys.GLOBAL_COMMISSIONS);
    });
  });
});
