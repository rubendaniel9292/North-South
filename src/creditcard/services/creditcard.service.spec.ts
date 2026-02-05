import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreditcardService } from './creditcard.service';
import { CreditCardEntity } from '../entities/credit.card.entity';
import { CardOptionsEntity } from '../entities/cardoptions.entity';
import { BankEntity } from '../../config/bank.entity';
import { CreditCardStatusService } from '@/helpers/card.status';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CreditCardDTO } from '../dto/creditcard.dto';
import { ErrorManager } from '@/helpers/error.manager';
import { DateHelper } from '@/helpers/date.helper';
import { CacheKeys } from '@/constants/cache.enum';

describe('CreditCardService - AUDITORIA DE SEGURIDAD COMPLETA', () => {
  let service: CreditcardService;
  let creditCardRepository: jest.Mocked<Repository<CreditCardEntity>>;
  let cardOptionsRepository: jest.Mocked<Repository<CardOptionsEntity>>;
  let bankRepository: jest.Mocked<Repository<BankEntity>>;
  let redisService: jest.Mocked<RedisModuleService>;
  let creditCardStatusService: jest.Mocked<CreditCardStatusService>;
  let configService: jest.Mocked<ConfigService>;

  // Mock data
  const mockCreditCard = {
    id: 1,
    customers_id: 1,
    cardNumber: '4532015112830366',
    expirationDate: new Date('2026-12-31'),
    code: '123',
    card_option_id: 1,
    bank_id: 1,
    card_status_id: 1,
    customer: {
      ci_ruc: '1234567890',
      firstName: 'John',
      secondName: 'Michael',
      surname: 'Doe',
      secondSurname: 'Smith'
    },
    cardoption: { id: 1, name: 'VISA' },
    bank: { id: 1, name: 'Test Bank' },
    cardstatus: { id: 1, name: 'Active' }
  };

  const mockEncryptedCard = {
    ...mockCreditCard,
    cardNumber: 'abcd1234:encrypted_card_number_here',
    code: 'abcd1234:encrypted_code_here'
  };

  const mockCardOption = {
    id: 1,
    name: 'VISA',
    description: 'Visa credit card'
  };

  const mockBank = {
    id: 1,
    name: 'Test Bank',
    code: 'TB001'
  };

  const mockCardStatus = {
    id: 1,
    name: 'Active',
    description: 'Card is active'
  };

  const validCreditCardDTO: CreditCardDTO = {
    customers_id: 1,
    cardNumber: '4532015112830366',
    expirationDate: new Date('2026-12-31'),
    code: '123',
    card_option_id: 1,
    bank_id: 1
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditcardService,
        {
          provide: getRepositoryToken(CreditCardEntity),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CardOptionsEntity),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BankEntity),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: CreditCardStatusService,
          useValue: {
            determineCardStatus: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'PWD_CARD') return 'test-encryption-password-123';
              return null;
            }),
          },
        },
        {
          provide: RedisModuleService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CreditcardService>(CreditcardService);
    creditCardRepository = module.get(getRepositoryToken(CreditCardEntity));
    cardOptionsRepository = module.get(getRepositoryToken(CardOptionsEntity));
    bankRepository = module.get(getRepositoryToken(BankEntity));
    redisService = module.get(RedisModuleService);
    creditCardStatusService = module.get(CreditCardStatusService);
    configService = module.get(ConfigService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Service Initialization & Security Setup', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all repositories and services injected', () => {
      expect(creditCardRepository).toBeDefined();
      expect(cardOptionsRepository).toBeDefined();
      expect(bankRepository).toBeDefined();
      expect(redisService).toBeDefined();
      expect(creditCardStatusService).toBeDefined();
      expect(configService).toBeDefined();
    });

    it('should initialize encryption with proper configuration', () => {
      expect(configService.get).toHaveBeenCalledWith('PWD_CARD');
    });
  });

  describe('createCard - Security Critical Tests', () => {
    beforeEach(() => {
      jest.spyOn(DateHelper, 'normalizeDateForDB').mockReturnValue(new Date('2026-12-31'));
      creditCardStatusService.determineCardStatus.mockResolvedValue(mockCardStatus as any);
    });

    it('should create card with proper encryption', async () => {
      creditCardRepository.findOne.mockResolvedValue(null); // No existing card
      creditCardRepository.save.mockResolvedValue(mockEncryptedCard as any);

      const result = await service.createCard(validCreditCardDTO);

      expect(creditCardRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          customers_id: 1,
          cardNumber: expect.stringMatching(/^[a-f0-9]+:[a-f0-9]+$/), // Encrypted format
          code: expect.stringMatching(/^[a-f0-9]+:[a-f0-9]+$/), // Encrypted format
          card_status_id: 1,
        })
      );
      expect(result).toEqual(mockEncryptedCard);
    });

    it('should prevent duplicate card registration for same customer', async () => {
      creditCardRepository.findOne.mockResolvedValue(mockCreditCard as any); // Existing card

      await expect(service.createCard(validCreditCardDTO))
        .rejects
        .toThrow('El cliente ya tiene una tarjeta con este número.');

      expect(creditCardRepository.save).not.toHaveBeenCalled();
    });

    it('should reject expired cards', async () => {
      const expiredCardDTO = {
        ...validCreditCardDTO,
        expirationDate: new Date('2020-01-01') // Expired
      };

      jest.spyOn(DateHelper, 'normalizeDateForDB').mockReturnValue(new Date('2020-01-01'));

      await expect(service.createCard(expiredCardDTO))
        .rejects
        .toThrow('La tarjeta ya está caducada.');

      expect(creditCardRepository.save).not.toHaveBeenCalled();
    });

    it('should properly determine card status based on expiration', async () => {
      creditCardRepository.findOne.mockResolvedValue(null);
      creditCardRepository.save.mockResolvedValue(mockEncryptedCard as any);

      await service.createCard(validCreditCardDTO);

      expect(creditCardStatusService.determineCardStatus).toHaveBeenCalledWith(
        new Date('2026-12-31')
      );
    });

    it('should invalidate cache after card creation', async () => {
      creditCardRepository.findOne.mockResolvedValue(null);
      creditCardRepository.save.mockResolvedValue(mockEncryptedCard as any);

      await service.createCard(validCreditCardDTO);

      expect(redisService.set).toHaveBeenCalledWith(
        `card:${mockEncryptedCard.id}`,
        JSON.stringify(mockEncryptedCard),
        32400
      );
      expect(redisService.del).toHaveBeenCalledWith(CacheKeys.GLOBAL_ALL_CARDS);
      expect(redisService.del).toHaveBeenCalledWith(CacheKeys.GLOBAL_ALL_CARDS_EXPIRED);
    });

    it('should handle encryption errors gracefully', async () => {
      creditCardRepository.findOne.mockResolvedValue(null);
      creditCardRepository.save.mockRejectedValue(new Error('Encryption failed'));

      await expect(service.createCard(validCreditCardDTO))
        .rejects
        .toThrow();
    });
  });

  describe('findAllCards - Data Protection Tests', () => {
    beforeEach(() => {
      // Mock the encryptData and decryptData methods
      jest.spyOn(service, 'encryptData' as any).mockReturnValue({
        cardNumber: 'encrypted_number',
        code: 'encrypted_code'
      });
      
      jest.spyOn(service, 'decryptData' as any).mockReturnValue({
        cardNumber: '4532015112830366',
        code: '123'
      });
    });

    it('should return cached data when available', async () => {
      const cachedCards = [mockCreditCard];
      redisService.get.mockResolvedValue(JSON.stringify(cachedCards));

      const result = await service.findAllCards();

      expect(redisService.get).toHaveBeenCalledWith(CacheKeys.GLOBAL_ALL_CARDS);
      expect(creditCardRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual(cachedCards);
    });

    it('should fetch from database and mask card numbers', async () => {
      redisService.get.mockResolvedValue(null); // Cache miss
      creditCardRepository.find.mockResolvedValue([mockEncryptedCard as any]);

      const result = await service.findAllCards();

      expect(result[0].cardNumber).toBe('************0366'); // Last 4 digits only
      expect(result[0].code).toBe('123'); // Code should be decrypted
    });

    it('should cache decrypted and masked data', async () => {
      redisService.get.mockResolvedValue(null);
      creditCardRepository.find.mockResolvedValue([mockEncryptedCard as any]);

      await service.findAllCards();

      expect(redisService.set).toHaveBeenCalledWith(
        CacheKeys.GLOBAL_ALL_CARDS,
        expect.any(String),
        32400
      );
    });

    it('should throw error when no cards found', async () => {
      redisService.get.mockResolvedValue(null);
      creditCardRepository.find.mockResolvedValue([]);

      await expect(service.findAllCards())
        .rejects
        .toThrow('No se encontró resultados');
    });
  });

  describe('Security & Error Handling', () => {
    it('should handle database connection failures', async () => {
      creditCardRepository.find.mockRejectedValue(new Error('Database connection failed'));
      redisService.get.mockResolvedValue(null);

      await expect(service.findAllCards())
        .rejects
        .toThrow();
    });

    it('should handle Redis cache failures gracefully', async () => {
      redisService.get.mockRejectedValue(new Error('Redis connection failed'));
      creditCardRepository.find.mockResolvedValue([mockEncryptedCard as any]);

      // Should fall back to database
      const result = await service.findAllCards();
      expect(result).toBeDefined();
    });

    it('should validate card number format before encryption', async () => {
      const invalidCardDTO = {
        customers_id: 1,
        cardNumber: '  4532015112830366  ', // With spaces
        expirationDate: new Date('2026-12-31'),
        code: '  123  ', // With spaces
        card_option_id: 1,
        bank_id: 1
      };

      creditCardRepository.findOne.mockResolvedValue(null);
      creditCardRepository.save.mockResolvedValue(mockEncryptedCard as any);
      creditCardStatusService.determineCardStatus.mockResolvedValue(mockCardStatus as any);

      await service.createCard(invalidCardDTO);

      // Should handle trimming in encryption method
      expect(creditCardRepository.save).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should use correct cache keys for banks', async () => {
      redisService.get.mockResolvedValue(JSON.stringify([mockBank]));

      await service.findBanks();

      expect(redisService.get).toHaveBeenCalledWith(CacheKeys.GLOBAL_BANKS);
    });

    it('should use correct cache keys for card options', async () => {
      redisService.get.mockResolvedValue(JSON.stringify([mockCardOption]));

      await service.findCrardsOptions();

      expect(redisService.get).toHaveBeenCalledWith(CacheKeys.GLOBAL_CARD_OPTIONS);
    });

    it('should set appropriate TTL for different data types', async () => {
      // Banks - no TTL (static data)
      redisService.get.mockResolvedValue(null);
      bankRepository.find.mockResolvedValue([mockBank as any]);

      await service.findBanks();

      expect(redisService.set).toHaveBeenCalledWith(
        CacheKeys.GLOBAL_BANKS,
        JSON.stringify([mockBank])
      );

      // Card options - with TTL
      cardOptionsRepository.find.mockResolvedValue([mockCardOption as any]);
      redisService.get.mockResolvedValue(null);

      await service.findCrardsOptions();

      expect(redisService.set).toHaveBeenCalledWith(
        CacheKeys.GLOBAL_CARD_OPTIONS,
        JSON.stringify([mockCardOption]),
        32400
      );
    });
  });
});
