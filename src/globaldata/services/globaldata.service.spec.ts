import { Test, TestingModule } from '@nestjs/testing';
import { GlobaldataService } from './globaldata.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProvinceEntity } from '@/globalentites/provincie.entity';
import { CityEntity } from '@/globalentites/city.entity';
import { CivilStatusEntity } from '@/globalentites/civilstatus.entity';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { ErrorManager } from '@/helpers/error.manager';
import { CacheKeys } from '@/constants/cache.enum';

describe('GlobaldataService', () => {
  let service: GlobaldataService;
  let provinceRepository: Repository<ProvinceEntity>;
  let cityRepository: Repository<CityEntity>;
  let civilRepository: Repository<CivilStatusEntity>;
  let redisService: RedisModuleService;

  const mockProvinces = [
    { id: '1', provinceName: 'Pichincha' },
    { id: '2', provinceName: 'Guayas' }
  ];

  const mockCities = [
    { 
      id: '1', 
      cityName: 'Quito',
      province: { id: '1', provinceName: 'Pichincha' }
    },
    { 
      id: '2', 
      cityName: 'Guayaquil',
      province: { id: '2', provinceName: 'Guayas' }
    }
  ];

  const mockCivilStatus = [
    { id: '1', status: 'Soltero' },
    { id: '2', status: 'Casado' },
    { id: '3', status: 'Divorciado' }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobaldataService,
        {
          provide: getRepositoryToken(ProvinceEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CityEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CivilStatusEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: RedisModuleService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GlobaldataService>(GlobaldataService);
    provinceRepository = module.get<Repository<ProvinceEntity>>(getRepositoryToken(ProvinceEntity));
    cityRepository = module.get<Repository<CityEntity>>(getRepositoryToken(CityEntity));
    civilRepository = module.get<Repository<CivilStatusEntity>>(getRepositoryToken(CivilStatusEntity));
    redisService = module.get<RedisModuleService>(RedisModuleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProvinces', () => {
    it('debería retornar provincias desde caché cuando existe', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(JSON.stringify(mockProvinces));

      // Act
      const result = await service.getAllProvinces();

      // Assert
      expect(result).toEqual(mockProvinces);
      expect(redisService.get).toHaveBeenCalledWith(CacheKeys.GLOBAL_PROVINCES);
      expect(provinceRepository.find).not.toHaveBeenCalled();
    });

    it('debería consultar la base de datos cuando no hay caché y almacenar resultado', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(provinceRepository, 'find').mockResolvedValue(mockProvinces as unknown as ProvinceEntity[]);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      // Act
      const result = await service.getAllProvinces();

      // Assert
      expect(result).toEqual(mockProvinces);
      expect(redisService.get).toHaveBeenCalledWith(CacheKeys.GLOBAL_PROVINCES);
      expect(provinceRepository.find).toHaveBeenCalledWith({
        order: { provinceName: 'ASC' }
      });
      expect(redisService.set).toHaveBeenCalledWith(
        CacheKeys.GLOBAL_PROVINCES,
        JSON.stringify(mockProvinces),
        3600
      );
    });

    it('debería lanzar NOT_FOUND cuando no hay provincias', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(provinceRepository, 'find').mockResolvedValue([]);

      // Act & Assert
      await expect(service.getAllProvinces()).rejects.toThrow(ErrorManager);
      await expect(service.getAllProvinces()).rejects.toThrow('No se encontraron provincias disponibles');
    });

    it('debería manejar errores de base de datos correctamente', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(provinceRepository, 'find').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getAllProvinces()).rejects.toThrow(ErrorManager);
      await expect(service.getAllProvinces()).rejects.toThrow('Error interno al obtener las provincias');
    });
  });

  describe('getAllCities', () => {
    it('debería retornar ciudades desde caché cuando existe', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(JSON.stringify(mockCities));

      // Act
      const result = await service.getAllCities();

      // Assert
      expect(result).toEqual(mockCities);
      expect(redisService.get).toHaveBeenCalledWith(CacheKeys.GLOBAL_CITIES);
      expect(cityRepository.find).not.toHaveBeenCalled();
    });

    it('debería consultar la base de datos con relaciones cuando no hay caché', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(cityRepository, 'find').mockResolvedValue(mockCities as unknown as CityEntity[]);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      // Act
      const result = await service.getAllCities();

      // Assert
      expect(result).toEqual(mockCities);
      expect(cityRepository.find).toHaveBeenCalledWith({
        relations: ['province'],
        select: {
          cityName: true,
          id: true,
          province: {
            id: true,
            provinceName: true,
          },
        },
        order: { cityName: 'ASC' }
      });
      expect(redisService.set).toHaveBeenCalledWith(
        CacheKeys.GLOBAL_CITIES,
        JSON.stringify(mockCities),
        3600
      );
    });

    it('debería lanzar NOT_FOUND cuando no hay ciudades', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(cityRepository, 'find').mockResolvedValue([]);

      // Act & Assert
      await expect(service.getAllCities()).rejects.toThrow(ErrorManager);
      await expect(service.getAllCities()).rejects.toThrow('No se encontraron ciudades disponibles');
    });
  });

  describe('getAllCivilStatus', () => {
    it('debería retornar estados civiles desde caché cuando existe', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(JSON.stringify(mockCivilStatus));

      // Act
      const result = await service.getAllCivilStatus();

      // Assert
      expect(result).toEqual(mockCivilStatus);
      expect(redisService.get).toHaveBeenCalledWith(CacheKeys.GLOBAL_CIVIL_STATUS);
      expect(civilRepository.find).not.toHaveBeenCalled();
    });

    it('debería consultar la base de datos cuando no hay caché', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(civilRepository, 'find').mockResolvedValue(mockCivilStatus as unknown as CivilStatusEntity[]);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      // Act
      const result = await service.getAllCivilStatus();

      // Assert
      expect(result).toEqual(mockCivilStatus);
      expect(civilRepository.find).toHaveBeenCalledWith({
        order: { status: 'ASC' }
      });
      expect(redisService.set).toHaveBeenCalledWith(
        CacheKeys.GLOBAL_CIVIL_STATUS,
        JSON.stringify(mockCivilStatus),
        3600
      );
    });

    it('debería lanzar NOT_FOUND cuando no hay estados civiles', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(civilRepository, 'find').mockResolvedValue([]);

      // Act & Assert
      await expect(service.getAllCivilStatus()).rejects.toThrow(ErrorManager);
      await expect(service.getAllCivilStatus()).rejects.toThrow('No se encontraron estados civiles disponibles');
    });

    it('debería manejar errores de Redis gracefully', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockRejectedValue(new Error('Redis connection failed'));
      jest.spyOn(civilRepository, 'find').mockResolvedValue(mockCivilStatus as unknown as CivilStatusEntity[]);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.getAllCivilStatus()).rejects.toThrow(ErrorManager);
      await expect(service.getAllCivilStatus()).rejects.toThrow('Error interno al obtener los estados civiles');
      expect(civilRepository.find).not.toHaveBeenCalled(); // Redis error previene llegada a DB
    });
  });

  describe('Error Handling', () => {
    it('debería propagar ErrorManager correctamente', async () => {
      // Arrange
      const customError = new ErrorManager({
        type: 'NOT_FOUND',
        message: 'Custom error message'
      });
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(provinceRepository, 'find').mockRejectedValue(customError);

      // Act & Assert
      await expect(service.getAllProvinces()).rejects.toThrow(customError);
    });

    it('debería convertir errores generales a ErrorManager con INTERNAL_SERVER_ERROR', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(provinceRepository, 'find').mockRejectedValue(new Error('Generic error'));

      // Act & Assert
      await expect(service.getAllProvinces()).rejects.toThrow(ErrorManager);
      await expect(service.getAllProvinces()).rejects.toThrow('Error interno al obtener las provincias');
    });
  });
});
