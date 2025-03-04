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
        relations: ['commissions', 'policies']
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
  public getAdvisorById = async (id: number): Promise<AdvisorEntity> => {
    try {

      const cachedAdvisorById = await this.redisService.get(`advisor:${id}`);
      if (cachedAdvisorById) {
        return JSON.parse(cachedAdvisorById);
      }
      const advisorById: AdvisorEntity = await this.advisdorRepository.findOne(
        { where: { id }, relations: ['commissions', 'policies'] }
      );
      if (!advisorById) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró el asesor',
        });
      }
      await this.redisService.set(`advisor:${id}`, JSON.stringify(advisorById), 32400); // TTL de 9 horas
      return advisorById;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3: Método para actualizar un cliente  
  public updateAvisor = async (
    id: number,
    updateData: Partial<AdvisorEntity>,
  ): Promise<AdvisorEntity> => {
    try {
      const advisor = await this.advisdorRepository.findOne({ where: { id } });
      console.log('Datos recibidos en el backend:', updateData);
      if (!advisor) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontró el cliente',
        });
      }
      // Convertir a mayúsculas y asignar de nuevo
      if (updateData.firstName) {
        updateData.firstName = updateData.firstName.toUpperCase();
      }
      if (updateData.secondName) {
        updateData.secondName = updateData.secondName.toUpperCase();
      }
      if (updateData.surname) {
        updateData.surname = updateData.surname.toUpperCase();
      }
      if (updateData.secondSurname) {
        updateData.secondSurname = updateData.secondSurname.toUpperCase();
      }
      // Validar y asignar solo las propiedades permitidas de updateData
      Object.assign(advisor, updateData);
      // Guardar el cliente actualizado en la base de datos
      const advisorUpdate = await this.advisdorRepository.save(advisor);

      // Limpiar todas las claves de caché relevantes
      await this.redisService.del(`advisor:${id}`);
      await this.redisService.del('advisors');

      // Actualizar caché con los datos más recientes
      await this.redisService.set(
        `advisor:${id}`,
        JSON.stringify(advisorUpdate),
        32400,
      );

      //console.log('Cliente actualizado:', customerUpdated);
      return advisorUpdate;

    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }
}
