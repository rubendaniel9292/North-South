
import { Test, TestingModule } from '@nestjs/testing';
import { GlobaldataModule } from './globaldata.module';
import { GlobaldataService } from './services/globaldata.service';
import { GlobaldataController } from './controller/globaldata.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProvinceEntity } from '@/globalentites/provincie.entity';
import { CityEntity } from '@/globalentites/city.entity';
import { CivilStatusEntity } from '@/globalentites/civilstatus.entity';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';

describe('GlobaldataModule', () => {
  let module: TestingModule;
  let service: GlobaldataService;
  let controller: GlobaldataController;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [],
      controllers: [GlobaldataController],
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
    controller = module.get<GlobaldataController>(GlobaldataController);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Module Configuration', () => {
    it('debería estar definido', () => {
      expect(module).toBeDefined();
    });

    it('debería tener GlobaldataService disponible', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(GlobaldataService);
    });

    it('debería tener GlobaldataController disponible', () => {
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(GlobaldataController);
    });

    it('debería tener repositories correctamente inyectados', () => {
      const provinceRepo = module.get(getRepositoryToken(ProvinceEntity));
      const cityRepo = module.get(getRepositoryToken(CityEntity));
      const civilRepo = module.get(getRepositoryToken(CivilStatusEntity));

      expect(provinceRepo).toBeDefined();
      expect(cityRepo).toBeDefined();
      expect(civilRepo).toBeDefined();
    });

    it('debería tener RedisModuleService correctamente inyectado', () => {
      const redisService = module.get<RedisModuleService>(RedisModuleService);
      expect(redisService).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('debería permitir comunicación entre controller y service', () => {
      // Verificar que el controller tiene acceso al service
      expect((controller as any).globaldataService).toBeDefined();
      expect((controller as any).globaldataService).toBe(service);
    });

    it('debería tener logger configurado en controller', () => {
      expect((controller as any).logger).toBeDefined();
      expect((controller as any).logger.context).toBe('GlobaldataController');
    });

    it('debería tener logger configurado en service', () => {
      expect((service as any).logger).toBeDefined();
      expect((service as any).logger.context).toBe('GlobaldataService');
    });

    it('debería tener TTL configurado en service', () => {
      expect((service as any).TTL_CACHE).toBeDefined();
      expect((service as any).TTL_CACHE).toBe(3600);
    });
  });
});
