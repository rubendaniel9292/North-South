import { AdvisorEntity } from '../entities/advisor.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, } from 'typeorm';
import { ValidateEntity } from '@/helpers/validations';
import { ErrorManager } from '@/helpers/error.manager';
import { AdvisorDTO } from '../dto/advisor.dto';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { DateHelper } from '@/helpers/date.helper';
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

      await this.validateInput(body, 'advisor');
      const birthday = DateHelper.normalizeDateForDB(body.birthdate);
      body.birthdate = birthday;
      body.firstName = body.firstName.toUpperCase();
      body.secondName = body.secondName.toUpperCase();
      body.surname = body.surname.toUpperCase()
      body.secondSurname = body.secondSurname.toUpperCase();
      const newAdvisor: AdvisorEntity =
        await this.advisdorRepository.save(body);

      // Invalidar la caché existente de todos los asesores
      await this.redisService.del('allAdvisors');

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
        where: whereConditions.length ? whereConditions : undefined,
        order: {
          id: "DESC",
        },
        relations: ['commissionRefunds', 'commissions', 'policies', 'policies.commissionRefunds']
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

  //3: metodo para listar los asesores por id
  public getAdvisorById = async (id: number): Promise<AdvisorEntity> => {
    try {

      const cachedAdvisorById = await this.redisService.get(`advisor:${id}`);
      if (cachedAdvisorById) {
        return JSON.parse(cachedAdvisorById);
      }
      const advisorById: AdvisorEntity = await this.advisdorRepository.findOne(
        { where: { id }, relations: ['commissionRefunds', 'policies.company','commissions', 'commissions.statusAdvance', 'policies.renewals', 'policies', 'policies.customer', 'policies.payments', 'policies.payments.paymentStatus', 'policies.commissions', 'policies.commissionRefunds'] }
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
      const advisor: AdvisorEntity = await this.advisdorRepository.findOne({ where: { id } });
      if (!advisor) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontró el cliente',
        });
      }
      // Convertir a mayúsculas y asignar de nuevo
      const birthday = DateHelper.normalizeDateForDB(updateData.birthdate);
      updateData.birthdate = birthday;
      updateData.firstName = updateData.firstName.toUpperCase();
      updateData.secondName = updateData.secondName.toUpperCase();
      updateData.surname = updateData.surname.toUpperCase();
      updateData.secondSurname = updateData.secondSurname.toUpperCase();
      // Validar y asignar solo las propiedades permitidas de updateData
      Object.assign(advisor, updateData);
      // Guardar el cliente actualizado en la base de datos
      await this.advisdorRepository.save(advisor);

      // Limpiar todas las claves de caché relevantes
      await this.redisService.del(`advisor:${id}`);
      await this.redisService.del('allAdvisors');

      // Obtener el asesor actualizado con todas sus relaciones
      const advisorWithRelations = await this.advisdorRepository.findOne({
        where: { id },
        relations: [
          'commissions',
          'policies',
          'policies.customer',                 // <-- ¡IMPORTANTE!
          'policies.payments',
          'policies.payments.paymentStatus',
          'policies.commissions'
        ]
      });

      // Actualizar caché con los datos más recientes incluyendo relaciones
      await this.redisService.set(
        `advisor:${id}`,
        JSON.stringify(advisorWithRelations),
        32400,
      );
      return advisorWithRelations;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }
}
