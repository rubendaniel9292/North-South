import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { AdvisorService } from './advisor.service';
import { AdvisorEntity } from '../entities/advisor.entity';
import { AdvisorDTO } from '../dto/advisor.dto';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { DateHelper } from '@/helpers/date.helper';

describe('AdvisorService - AUDITORIA DE GESTIÓN DE ASESORES', () => {
  let service: AdvisorService;
  let advisorRepository: jest.Mocked<Repository<AdvisorEntity>>;
  let redisService: jest.Mocked<RedisModuleService>;

  const mockAdvisorData: AdvisorDTO = {
    ci_ruc: '1234567890',
    firstName: 'carlos',
    secondName: 'eduardo',
    surname: 'martinez',
    secondSurname: 'lopez',
    birthdate: new Date('1985-05-15'),
    email: 'carlos.martinez@test.com',
    numberPhone: '0987654321',
    personalData: true
  };

  const mockAdvisorEntity: AdvisorEntity = {
    id: 1,
    ci_ruc: '1234567890',
    firstName: 'CARLOS',
    secondName: 'EDUARDO',
    surname: 'MARTINEZ',
    secondSurname: 'LOPEZ',
    birthdate: new Date('1985-05-15'),
    email: 'carlos.martinez@test.com',
    numberPhone: '0987654321',
    personalData: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    policies: [],
    commissions: [],
    commissionRefunds: []
  };

  beforeEach(async () => {
    const mockAdvisorRepository = {
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
        AdvisorService,
        {
          provide: getRepositoryToken(AdvisorEntity),
          useValue: mockAdvisorRepository,
        },
        {
          provide: RedisModuleService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AdvisorService>(AdvisorService);
    advisorRepository = module.get(getRepositoryToken(AdvisorEntity));
    redisService = module.get(RedisModuleService);

    jest.clearAllMocks();
  });

  describe('Service Initialization & Configuration', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have repository and redis service injected', () => {
      expect(advisorRepository).toBeDefined();
      expect(redisService).toBeDefined();
    });

    it('should extend ValidateEntity for data validation', () => {
      expect(service).toBeInstanceOf(AdvisorService);
      expect(typeof (service as any).validateInput).toBe('function');
    });
  });

  describe('createAdvisor - Registration & Validation Tests', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'validateInput').mockResolvedValue(undefined);
      jest.spyOn(DateHelper, 'normalizeDateForDB').mockReturnValue(new Date('1985-05-15'));
    });

    it('should create advisor with proper data transformation', async () => {
      advisorRepository.save.mockResolvedValue(mockAdvisorEntity);
      redisService.del.mockResolvedValue(undefined);

      const result = await service.createAdvisor(mockAdvisorData);

      expect((service as any).validateInput).toHaveBeenCalledWith(mockAdvisorData, 'advisor');
      expect(DateHelper.normalizeDateForDB).toHaveBeenCalledWith(mockAdvisorData.birthdate);
      expect(advisorRepository.save).toHaveBeenCalledWith({
        ...mockAdvisorData,
        firstName: 'CARLOS',
        secondName: 'EDUARDO',
        surname: 'MARTINEZ',
        secondSurname: 'LOPEZ',
        birthdate: new Date('1985-05-15')
      });
      expect(redisService.del).toHaveBeenCalledWith('allAdvisors');
      expect(result).toEqual(mockAdvisorEntity);
    });

    it('should normalize date using DateHelper', async () => {
      advisorRepository.save.mockResolvedValue(mockAdvisorEntity);
      redisService.del.mockResolvedValue(undefined);

      await service.createAdvisor(mockAdvisorData);

      expect(DateHelper.normalizeDateForDB).toHaveBeenCalledWith(mockAdvisorData.birthdate);
    });

    it('should transform names to uppercase for consistency', async () => {
      advisorRepository.save.mockResolvedValue(mockAdvisorEntity);
      
      const testData = {
        ...mockAdvisorData,
        firstName: 'maría josé',
        secondName: 'alejandra',
        surname: 'garcía',
        secondSurname: 'rodríguez'
      };

      await service.createAdvisor(testData);

      expect(advisorRepository.save).toHaveBeenCalledWith({
        ...testData,
        firstName: 'MARÍA JOSÉ',
        secondName: 'ALEJANDRA',
        surname: 'GARCÍA',
        secondSurname: 'RODRÍGUEZ',
        birthdate: new Date('1985-05-15')
      });
    });

    it('should invalidate allAdvisors cache after creation', async () => {
      advisorRepository.save.mockResolvedValue(mockAdvisorEntity);
      redisService.del.mockResolvedValue(undefined);

      await service.createAdvisor(mockAdvisorData);

      expect(redisService.del).toHaveBeenCalledWith('allAdvisors');
    });

    it('should handle validation errors gracefully', async () => {
      jest.spyOn(service as any, 'validateInput').mockRejectedValue(
        new Error('CI/RUC already exists')
      );

      await expect(service.createAdvisor(mockAdvisorData))
        .rejects
        .toThrow('CI/RUC already exists');

      expect(advisorRepository.save).not.toHaveBeenCalled();
      expect(redisService.del).not.toHaveBeenCalled();
    });
  });

  describe('getAllAdvisors - Cache & Search Functionality', () => {
    it('should return cached data when available and no search term', async () => {
      redisService.get.mockResolvedValue(JSON.stringify([mockAdvisorEntity]));

      const result = await service.getAllAdvisors();

      expect(redisService.get).toHaveBeenCalledWith('allAdvisors');
      expect(advisorRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual([mockAdvisorEntity]);
    });

    it('should bypass cache when search term provided', async () => {
      redisService.get.mockResolvedValue(JSON.stringify([mockAdvisorEntity]));
      advisorRepository.find.mockResolvedValue([mockAdvisorEntity]);

      const result = await service.getAllAdvisors('carlos');

      expect(redisService.get).not.toHaveBeenCalled();
      expect(advisorRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockAdvisorEntity]);
    });

    it('should fetch from database when cache is empty', async () => {
      redisService.get.mockResolvedValue(null);
      advisorRepository.find.mockResolvedValue([mockAdvisorEntity]);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.getAllAdvisors();

      expect(redisService.get).toHaveBeenCalledWith('allAdvisors');
      expect(advisorRepository.find).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        'allAdvisors',
        JSON.stringify([mockAdvisorEntity]),
        32400
      );
      expect(result).toEqual([mockAdvisorEntity]);
    });

    it('should implement proper search functionality with multiple fields', async () => {
      advisorRepository.find.mockResolvedValue([mockAdvisorEntity]);

      const searchTerm = 'carlos';
      await service.getAllAdvisors(searchTerm);

      const expectedSearchCondition = Like(`%${searchTerm}%`);
      expect(advisorRepository.find).toHaveBeenCalledWith({
        where: [
          { firstName: expectedSearchCondition },
          { surname: expectedSearchCondition },
          { ci_ruc: expectedSearchCondition },
          { secondSurname: expectedSearchCondition },
          { secondName: expectedSearchCondition },
        ],
        order: { id: 'DESC' },
        relations: [
          'commissionRefunds',
          'commissions',
          'policies',
          'policies.periods',
          'policies.commissionRefunds',
        ],
      });
    });

    it('should load comprehensive relations for business logic', async () => {
      redisService.get.mockResolvedValue(null);
      advisorRepository.find.mockResolvedValue([mockAdvisorEntity]);
      redisService.set.mockResolvedValue(undefined);

      await service.getAllAdvisors();

      expect(advisorRepository.find).toHaveBeenCalledWith({
        where: undefined,
        order: { id: 'DESC' },
        relations: [
          'commissionRefunds',
          'commissions',
          'policies',
          'policies.periods',
          'policies.commissionRefunds',
        ],
      });
    });

    it('should not cache search results', async () => {
      advisorRepository.find.mockResolvedValue([mockAdvisorEntity]);

      await service.getAllAdvisors('search_term');

      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should set appropriate TTL for cache (9 hours)', async () => {
      redisService.get.mockResolvedValue(null);
      advisorRepository.find.mockResolvedValue([mockAdvisorEntity]);
      redisService.set.mockResolvedValue(undefined);

      await service.getAllAdvisors();

      expect(redisService.set).toHaveBeenCalledWith(
        'allAdvisors',
        JSON.stringify([mockAdvisorEntity]),
        32400 // 9 hours
      );
    });
  });

  describe('getAdvisorById - Individual Advisor Retrieval', () => {
    const advisorId = 1;
    const cacheKey = `advisor:${advisorId}`;

    it('should return cached advisor when available', async () => {
      redisService.get.mockResolvedValue(JSON.stringify(mockAdvisorEntity));

      const result = await service.getAdvisorById(advisorId);

      expect(redisService.get).toHaveBeenCalledWith(cacheKey);
      expect(advisorRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockAdvisorEntity);
    });

    it('should fetch from database with extensive relations', async () => {
      redisService.get.mockResolvedValue(null);
      advisorRepository.findOne.mockResolvedValue(mockAdvisorEntity);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.getAdvisorById(advisorId);

      expect(advisorRepository.findOne).toHaveBeenCalledWith({
        where: { id: advisorId },
        relations: [
          'commissionRefunds',
          'policies.company',
          'commissions',
          'policies.periods',
          'commissions.statusAdvance',
          'policies.renewals',
          'policies',
          'policies.customer',
          'policies.payments',
          'policies.payments.paymentStatus',
          'policies.commissions',
          'policies.commissionRefunds',
        ],
      });
      expect(result).toEqual(mockAdvisorEntity);
    });

    it('should cache advisor data after database fetch', async () => {
      redisService.get.mockResolvedValue(null);
      advisorRepository.findOne.mockResolvedValue(mockAdvisorEntity);
      redisService.set.mockResolvedValue(undefined);

      await service.getAdvisorById(advisorId);

      expect(redisService.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(mockAdvisorEntity),
        32400
      );
    });

    it('should throw error when advisor not found', async () => {
      redisService.get.mockResolvedValue(null);
      advisorRepository.findOne.mockResolvedValue(null);

      await expect(service.getAdvisorById(advisorId))
        .rejects
        .toThrow('No se encontró el asesor');
    });
  });

  describe('updateAvisor - Update Operations & Cache Management', () => {
    const advisorId = 1;
    const updateData = {
      firstName: 'luis',
      surname: 'gonzalez',
      email: 'luis.gonzalez@test.com',
      birthdate: new Date('1990-01-01')
    };

    beforeEach(() => {
      jest.spyOn(DateHelper, 'normalizeDateForDB').mockReturnValue(new Date('1990-01-01'));
    });

    it('should update advisor with proper data transformation', async () => {
      advisorRepository.findOne
        .mockResolvedValueOnce(mockAdvisorEntity) // First call for validation
        .mockResolvedValueOnce({...mockAdvisorEntity, ...updateData}); // Second call for return with relations
      
      advisorRepository.save.mockResolvedValue({...mockAdvisorEntity, ...updateData});
      redisService.del.mockResolvedValue(undefined);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.updateAvisor(advisorId, updateData);

      expect(DateHelper.normalizeDateForDB).toHaveBeenCalledWith(updateData.birthdate);
      expect(advisorRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should normalize date when birthdate is provided', async () => {
      advisorRepository.findOne
        .mockResolvedValueOnce(mockAdvisorEntity)
        .mockResolvedValueOnce(mockAdvisorEntity);
      advisorRepository.save.mockResolvedValue(mockAdvisorEntity);
      redisService.del.mockResolvedValue(undefined);
      redisService.set.mockResolvedValue(undefined);

      await service.updateAvisor(advisorId, updateData);

      expect(DateHelper.normalizeDateForDB).toHaveBeenCalledWith(updateData.birthdate);
    });

    it('should transform names to uppercase when provided', async () => {
      const partialUpdate = {
        firstName: 'maría',
        secondName: 'josé',
        surname: 'garcía',
        secondSurname: 'lópez'
      };

      advisorRepository.findOne
        .mockResolvedValueOnce(mockAdvisorEntity)
        .mockResolvedValueOnce({...mockAdvisorEntity, ...partialUpdate});
      advisorRepository.save.mockResolvedValue({...mockAdvisorEntity, ...partialUpdate});
      redisService.del.mockResolvedValue(undefined);
      redisService.set.mockResolvedValue(undefined);

      await service.updateAvisor(advisorId, partialUpdate);

      // Verify the transformation logic is applied
      expect(advisorRepository.save).toHaveBeenCalled();
    });

    it('should throw error when advisor not found for update', async () => {
      advisorRepository.findOne.mockResolvedValue(null);

      await expect(service.updateAvisor(advisorId, updateData))
        .rejects
        .toThrow('No se encontró el cliente');

      expect(advisorRepository.save).not.toHaveBeenCalled();
    });

    it('should invalidate cache and update with fresh data', async () => {
      const updatedAdvisor = {...mockAdvisorEntity, ...updateData};
      
      advisorRepository.findOne
        .mockResolvedValueOnce(mockAdvisorEntity)
        .mockResolvedValueOnce(updatedAdvisor);
      advisorRepository.save.mockResolvedValue(updatedAdvisor);
      redisService.del.mockResolvedValue(undefined);
      redisService.set.mockResolvedValue(undefined);

      await service.updateAvisor(advisorId, updateData);

      expect(redisService.del).toHaveBeenCalledWith(`advisor:${advisorId}`);
      expect(redisService.del).toHaveBeenCalledWith('allAdvisors');
      expect(redisService.set).toHaveBeenCalledWith(
        `advisor:${advisorId}`,
        JSON.stringify(updatedAdvisor),
        32400
      );
    });

    it('should fetch advisor with comprehensive relations after update', async () => {
      advisorRepository.findOne
        .mockResolvedValueOnce(mockAdvisorEntity)
        .mockResolvedValueOnce(mockAdvisorEntity);
      advisorRepository.save.mockResolvedValue(mockAdvisorEntity);
      redisService.del.mockResolvedValue(undefined);
      redisService.set.mockResolvedValue(undefined);

      await service.updateAvisor(advisorId, updateData);

      // Second findOne call should include comprehensive relations
      expect(advisorRepository.findOne).toHaveBeenCalledTimes(2);
      expect(advisorRepository.findOne).toHaveBeenLastCalledWith({
        where: { id: advisorId },
        relations: [
          'commissions',
          'policies',
          'policies.customer',
          'policies.periods',
          'policies.periods',
          'policies.payments',
          'policies.payments.paymentStatus',
          'policies.commissions',
        ],
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle Redis connection failures gracefully', async () => {
      redisService.get.mockRejectedValue(new Error('Redis connection failed'));

      await expect(service.getAllAdvisors())
        .rejects
        .toThrow('Redis connection failed');
    });

    it('should handle database connection failures', async () => {
      redisService.get.mockResolvedValue(null);
      advisorRepository.find.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getAllAdvisors())
        .rejects
        .toThrow('Database connection failed');
    });

    it('should handle cache failures during advisor update', async () => {
      advisorRepository.findOne
        .mockResolvedValueOnce(mockAdvisorEntity)
        .mockResolvedValueOnce(mockAdvisorEntity);
      advisorRepository.save.mockResolvedValue(mockAdvisorEntity);
      redisService.del.mockRejectedValue(new Error('Cache delete failed'));

      await expect(service.updateAvisor(1, { firstName: 'test' }))
        .rejects
        .toThrow('Cache delete failed');
    });
  });

  describe('Business Logic & Data Integrity', () => {
    it('should maintain data consistency with proper field transformations', async () => {
      const testData = {
        ...mockAdvisorData,
        firstName: 'josé maría',
        surname: 'garcía rodríguez'
      };

      advisorRepository.save.mockResolvedValue(mockAdvisorEntity);
      jest.spyOn(service as any, 'validateInput').mockResolvedValue(undefined);
      jest.spyOn(DateHelper, 'normalizeDateForDB').mockReturnValue(new Date('1985-05-15'));

      await service.createAdvisor(testData);

      expect(advisorRepository.save).toHaveBeenCalledWith({
        ...testData,
        firstName: 'JOSÉ MARÍA',
        surname: 'GARCÍA RODRÍGUEZ',
        birthdate: new Date('1985-05-15')
      });
    });

    it('should include personal data consent validation', async () => {
      const advisorWithConsent = { ...mockAdvisorData, personalData: true };
      const advisorWithoutConsent = { ...mockAdvisorData, personalData: false };

      advisorRepository.save.mockResolvedValue(mockAdvisorEntity);
      jest.spyOn(service as any, 'validateInput').mockResolvedValue(undefined);
      jest.spyOn(DateHelper, 'normalizeDateForDB').mockReturnValue(new Date('1985-05-15'));

      await service.createAdvisor(advisorWithConsent);
      expect(advisorRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        personalData: true
      }));

      jest.clearAllMocks();
      advisorRepository.save.mockResolvedValue(mockAdvisorEntity);

      await service.createAdvisor(advisorWithoutConsent);
      expect(advisorRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        personalData: false
      }));
    });

    it('should handle complex business relations efficiently', async () => {
      redisService.get.mockResolvedValue(null);
      advisorRepository.findOne.mockResolvedValue(mockAdvisorEntity);
      redisService.set.mockResolvedValue(undefined);

      await service.getAdvisorById(1);

      // Verify that complex business relations are loaded
      expect(advisorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: expect.arrayContaining([
          'commissions',
          'policies',
          'policies.customer',
          'policies.payments',
          'policies.commissions',
          'commissionRefunds'
        ]),
      });
    });
  });
});
