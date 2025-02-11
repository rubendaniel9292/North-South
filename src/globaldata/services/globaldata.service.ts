import { CivilStatusEntity } from '@/globalentites/civilstatus.entity';
import { CityEntity } from '@/globalentites/city.entity';
import { ProvinceEntity } from '@/globalentites/provincie.entity';
import { ErrorManager } from '@/helpers/error.manager';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CacheKeys } from '@/constants/cache.enum';

@Injectable()
export class GlobaldataService {
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
    try {
      //const cachedCProvinces = await this.redisService.get('allProvinces');
      const cachedProvinces = await this.redisService.get(CacheKeys.GLOBAL_PROVINCES); // Usa el enum
      if (cachedProvinces) {
        return JSON.parse(cachedProvinces);
      }
      const allProvinces: ProvinceEntity[] =
        await this.provinceRepository.find();
      if (!allProvinces || allProvinces.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      // Guardar los datos desencriptados en Redis
      //await this.redisService.set('allProvinces', JSON.stringify(allProvinces));
      await this.redisService.set(CacheKeys.GLOBAL_PROVINCES, JSON.stringify(allProvinces));
      return allProvinces;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: metodo para obetener el listado de ciudades o cantones
  public getAllCities = async (): Promise<CityEntity[]> => {
    try {
      const cachedCities = await this.redisService.get(CacheKeys.GLOBAL_CITIES); // Usa el enum
      //const cachedCitys = await this.redisService.get('allCitys'); // Clave nueva
      if (cachedCities) {
        return JSON.parse(cachedCities);
      }
      const allCities: CityEntity[] = await this.cityRepository.find({
        relations: ['province'],
        select: {
          cityName: true,
          id: true,
          province: {
            id: true,
            provinceName: true, // Selecciona solo el nombre de la provincia
          },
        },
      });
      if (!allCities || allCities.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      await this.redisService.set(CacheKeys.GLOBAL_CITIES, JSON.stringify(allCities));
      //await this.redisService.set('allCitys', JSON.stringify(allCitys));
      return allCities;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: metodo para obetener el listado de ciudades o cantones
  public getAllCivilStatus = async (): Promise<CivilStatusEntity[]> => {
    try {
      const cachedStatus = await this.redisService.get(CacheKeys.GLOBAL_CIVIL_STATUS); // Usa el enum
      //const cachedStatus = await this.redisService.get('allStatus');
      if (cachedStatus) {
        return JSON.parse(cachedStatus);
      }
      const allStatus: CivilStatusEntity[] = await this.civilRepository.find();
      if (!allStatus || allStatus.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      // Guardar los datos en Redis
      //await this.redisService.set('allStatus', JSON.stringify(allStatus));
      await this.redisService.set(CacheKeys.GLOBAL_CIVIL_STATUS, JSON.stringify(allStatus));
      return allStatus;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
