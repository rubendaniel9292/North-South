import { CivilStatusEntity } from '@/globalentites/civilstatus.entity';
import { CityEntity } from '@/globalentites/city.entity';
import { ProvinceEntity } from '@/globalentites/provincie.entity';
import { ErrorManager } from '@/helpers/error.manager';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class GlobaldataService {
  constructor(
    @InjectRepository(ProvinceEntity)
    private readonly provinceRepository: Repository<ProvinceEntity>,
    @InjectRepository(CityEntity)
    private readonly cityRepository: Repository<CityEntity>,
    @InjectRepository(CivilStatusEntity)
    private readonly civilRepository: Repository<CivilStatusEntity>,
  ) {}
  //1: metodo para obetener el listado de provincias
  public getAllProvinces = async (): Promise<ProvinceEntity[]> => {
    try {
      const allProvinces: ProvinceEntity[] =
        await this.provinceRepository.find();
      if (!allProvinces || allProvinces.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      return allProvinces;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: metodo para obetener el listado de ciudades o cantones
  public getAllCitys = async (): Promise<CityEntity[]> => {
    try {
      const allCitys: CityEntity[] = await this.cityRepository.find({
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
      if (!allCitys || allCitys.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      return allCitys;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: metodo para obetener el listado de ciudades o cantones
  public getAllCivilStatus = async (): Promise<CivilStatusEntity[]> => {
    try {
      const allStatus: CivilStatusEntity[] = await this.civilRepository.find();
      if (!allStatus || allStatus.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      return allStatus;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
