import { AdvisorEntity } from '../entities/advisor.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, } from 'typeorm';
import { ValidateEntity } from '@/helpers/validations';
import { ErrorManager } from '@/helpers/error.manager';
import { AdvisorDTO } from '../dto/advisor.dto';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';

@Injectable()
export class AdvisorService extends ValidateEntity {
  constructor(
    @InjectRepository(AdvisorEntity)
    private readonly advisdorRepository: Repository<AdvisorEntity>,
    private readonly redisService: RedisModuleService
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(advisdorRepository);
  }
  //1:metodo para registrar un asesor
  public createAdvisor = async (body: AdvisorDTO): Promise<AdvisorEntity> => {
    try {
      // Primero validamos cédula y correo
      console.log('Valor recibido desde Postman:', body.personalData);
      // Convertir el valor de personalData a booleano
      //body.personalData = body.personalData === 'true' || body.personalData === true;
      await this.validateInput(body, 'advisor');
      const newAdvisor: AdvisorEntity =
        await this.advisdorRepository.save(body);
      console.log(body.personalData);
      //consulta futura para la eliminacion del usuario no se aconseja en produccion
      //await this.customersRepository.query(`TRUNCATE TABLE customers RESTART IDENTITY CASCADE`);

      console.log(newAdvisor);
      console.log('After Save:', newAdvisor.personalData);
      return newAdvisor;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: metodo para buscar los asesores
  public getAllAdvisors = async (search?: string) => {

    try {

      // Verificar si los datos están en Redis
      const cachedAllAdvisors = await this.redisService.get('allAdvisors');
      if (cachedAllAdvisors) {
        return JSON.parse(cachedAllAdvisors);
      }
      // Crea un array de condiciones de búsqueda
      const whereConditions: any[] = [];

      if (search) {
        const searchCondition = Like(`%${search}%`);
        whereConditions.push(
          { firstName: searchCondition },
          { surname: searchCondition },
          { ci_ruc: searchCondition },
          { secondSurname: searchCondition },
          { secondName: searchCondition }
        );
      }
      const allAdvisors: AdvisorEntity[] = await this.advisdorRepository.find({
        order: {
          id: "DESC",
        },
        relations: ['advances', 'policies']
      }
      );
      await this.redisService.set(
        'allAdvisors',
        JSON.stringify(allAdvisors),
        32400,
      ); // TTL de 9 horas
      return allAdvisors;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };


  //2: metodo para buscar los asesores
  public getAdvisorBiId = async (id: number) => {
    try {
      const cachedAdvisorById = await this.redisService.get('advisorById');
      if (cachedAdvisorById) {
        return JSON.parse(cachedAdvisorById);
      }
      const advisorById: AdvisorEntity = await this.advisdorRepository.findOne(
        { where: { id } }
      );
      await this.redisService.set('advisorById', JSON.stringify(advisorById), 32400); // TTL de 9 horas
      return advisorById;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
