import { CivilStatusEntity } from '@/globalentites/civilstatus.entity';
import { CityEntity } from '@/globalentites/city.entity';
import { ProvinceEntity } from '@/globalentites/provincie.entity';
import { ErrorManager } from '@/helpers/error.manager';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CacheKeys } from '@/constants/cache.enum';

@Injectable()
export class GlobaldataService {
  private readonly logger = new Logger(GlobaldataService.name);
  private readonly TTL_CACHE = 3600; // 1 hora

  constructor(
    @InjectRepository(ProvinceEntity)
    private readonly provinceRepository: Repository<ProvinceEntity>,
    @InjectRepository(CityEntity)
    private readonly cityRepository: Repository<CityEntity>,
    @InjectRepository(CivilStatusEntity)
    private readonly civilRepository: Repository<CivilStatusEntity>,
    private readonly redisService: RedisModuleService
  ) { }
  //1: metodo para obetener el listado de provincias
  public getAllProvinces = async (): Promise<ProvinceEntity[]> => {
    this.logger.log('Iniciando búsqueda de todas las provincias');
    
    try {
      // Verificar caché primero
      const cachedProvinces = await this.redisService.get(CacheKeys.GLOBAL_PROVINCES);
      if (cachedProvinces) {
        this.logger.log('Provincias obtenidas desde caché');
        return JSON.parse(cachedProvinces);
      }

      // Consultar base de datos
      const allProvinces: ProvinceEntity[] = await this.provinceRepository.find({
        order: { provinceName: 'ASC' }
      });

      if (!allProvinces || allProvinces.length === 0) {
        this.logger.warn('No se encontraron provincias en la base de datos');
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontraron provincias disponibles',
        });
      }

      // Almacenar en caché con TTL
      await this.redisService.set(
        CacheKeys.GLOBAL_PROVINCES, 
        JSON.stringify(allProvinces),
        this.TTL_CACHE
      );

      this.logger.log(`Se encontraron ${allProvinces.length} provincias y se almacenaron en caché`);
      return allProvinces;

    } catch (error) {
      this.logger.error('Error al obtener provincias', error.stack);
      if (error instanceof ErrorManager) {
        throw error;
      }
      throw new ErrorManager({
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno al obtener las provincias',
      });
    }
  };

  //2: metodo para obetener el listado de ciudades o cantones
  public getAllCities = async (): Promise<CityEntity[]> => {
    this.logger.log('Iniciando búsqueda de todas las ciudades');
    
    try {
      // Verificar caché primero
      const cachedCities = await this.redisService.get(CacheKeys.GLOBAL_CITIES);
      if (cachedCities) {
        this.logger.log('Ciudades obtenidas desde caché');
        return JSON.parse(cachedCities);
      }

      // Consultar base de datos con relaciones
      const allCities: CityEntity[] = await this.cityRepository.find({
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

      if (!allCities || allCities.length === 0) {
        this.logger.warn('No se encontraron ciudades en la base de datos');
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontraron ciudades disponibles',
        });
      }

      // Almacenar en caché con TTL
      await this.redisService.set(
        CacheKeys.GLOBAL_CITIES, 
        JSON.stringify(allCities),
        this.TTL_CACHE
      );

      this.logger.log(`Se encontraron ${allCities.length} ciudades y se almacenaron en caché`);
      return allCities;

    } catch (error) {
      this.logger.error('Error al obtener ciudades', error.stack);
      if (error instanceof ErrorManager) {
        throw error;
      }
      throw new ErrorManager({
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno al obtener las ciudades',
      });
    }
  };

  //3: metodo para obetener el listado de estados civiles
  public getAllCivilStatus = async (): Promise<CivilStatusEntity[]> => {
    this.logger.log('Iniciando búsqueda de todos los estados civiles');
    
    try {
      // Verificar caché primero
      const cachedStatus = await this.redisService.get(CacheKeys.GLOBAL_CIVIL_STATUS);
      if (cachedStatus) {
        this.logger.log('Estados civiles obtenidos desde caché');
        return JSON.parse(cachedStatus);
      }

      // Consultar base de datos
      const allStatus: CivilStatusEntity[] = await this.civilRepository.find({
        order: { status: 'ASC' }
      });

      if (!allStatus || allStatus.length === 0) {
        this.logger.warn('No se encontraron estados civiles en la base de datos');
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontraron estados civiles disponibles',
        });
      }

      // Almacenar en caché con TTL
      await this.redisService.set(
        CacheKeys.GLOBAL_CIVIL_STATUS, 
        JSON.stringify(allStatus),
        this.TTL_CACHE
      );

      this.logger.log(`Se encontraron ${allStatus.length} estados civiles y se almacenaron en caché`);
      return allStatus;

    } catch (error) {
      this.logger.error('Error al obtener estados civiles', error.stack);
      if (error instanceof ErrorManager) {
        throw error;
      }
      throw new ErrorManager({
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno al obtener los estados civiles',
      });
    }
  };
}
