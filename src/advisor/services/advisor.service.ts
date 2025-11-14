import { AdvisorEntity } from '../entities/advisor.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { ValidateEntity } from '@/helpers/validations';
import { ErrorManager } from '@/helpers/error.manager';
import { AdvisorDTO } from '../dto/advisor.dto';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { DateHelper } from '@/helpers/date.helper';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { PaymentEntity } from '@/payment/entity/payment.entity';
@Injectable()
export class AdvisorService extends ValidateEntity {
  constructor(
    @InjectRepository(AdvisorEntity)
    private readonly advisdorRepository: Repository<AdvisorEntity>,
    private readonly redisService: RedisModuleService,
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
      body.surname = body.surname.toUpperCase();
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
      // Solo usar caché si no hay búsqueda específica

      if (!search) {
        const cachedAllAdvisors = await this.redisService.get('allAdvisors');
        if (cachedAllAdvisors) {
          return JSON.parse(cachedAllAdvisors);
        }
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
          { secondName: searchCondition },
        );
      }
      const allAdvisors: AdvisorEntity[] = await this.advisdorRepository.find({
        where: whereConditions.length ? whereConditions : undefined,
        order: {
          id: 'DESC',
        },
        relations: [
          //'commissionRefunds',
          //'commissions',
          'policies',
          //'policies.periods',
          //'policies.commissionRefunds',
        ],
        select: {
          'policies': { id: true, numberPolicy: true } // Solo traer el ID de las polizas para contar
        }
      });
      // Solo guardar en caché si no hubo búsqueda

      if (!search) {
        await this.redisService.set(
          'allAdvisors',
          JSON.stringify(allAdvisors),
          32400,
        ); // TTL de 9 horas
      }
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

      const advisorById: AdvisorEntity = await this.advisdorRepository.findOne({
        where: { id },
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
      if (!advisorById) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró el asesor',
        });
      }

      await this.redisService.set(
        `advisor:${id}`,
        JSON.stringify(advisorById),
        32400,
      ); // TTL de 9 horas

      return advisorById;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3.1: Método OPTIMIZADO con PAGINACIÓN para evitar memory leaks definitivamente
  public getAdvisorByIdOptimized = async (
    id: number, 
    page: number = 1, 
    limit: number = 50
  ): Promise<any> => {
    try {
      // 1. Verificar caché (solo para datos básicos del asesor, no pólizas)
      const cacheKey = `advisor:${id}:basic`;
      let advisor = await this.redisService.get(cacheKey);
      
      if (!advisor) {
        // Cargar datos básicos del asesor
        const advisorData = await this.advisdorRepository.findOne({
          where: { id },
          relations: [
            'commissionRefunds',
            'commissions',
            'commissions.statusAdvance',
          ],
        });

        if (!advisorData) {
          throw new ErrorManager({
            type: 'BAD_REQUEST',
            message: 'No se encontró el asesor',
          });
        }

        // Guardar datos básicos en caché (1 hora)
        await this.redisService.set(cacheKey, JSON.stringify(advisorData), 3600);
        advisor = JSON.stringify(advisorData);
      }

      const advisorParsed = JSON.parse(advisor);

      // 2. Contar total de pólizas para paginación
      const policyRepository = this.advisdorRepository.manager.getRepository(PolicyEntity);
      const totalPolicies = await policyRepository.count({
        where: { advisor_id: id },
      });

      // 3. Calcular skip para paginación
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalPolicies / limit);

      // 4. Cargar pólizas paginadas con relaciones básicas (sin payments)
      const policies = await policyRepository.find({
        where: { advisor_id: id },
        relations: [
          'company',
          'customer',
          'periods',
          'renewals',
          'commissions',
          'commissionRefunds',
        ],
        order: {
          id: 'DESC',
        },
        skip,
        take: limit,
      });

      // 5. Cargar payments solo para las pólizas de esta página en lotes pequeños
      if (policies && policies.length > 0) {
        const paymentRepository = this.advisdorRepository.manager.getRepository(PaymentEntity);
        const batchSize = 5;

        for (let i = 0; i < policies.length; i += batchSize) {
          const policiesBatch = policies.slice(i, i + batchSize);
          const batchIds = policiesBatch.map(p => p.id);
          
          const paymentsInBatch = await paymentRepository.find({
            where: { policy_id: In(batchIds) },
            relations: ['paymentStatus'],
            order: {
              number_payment: 'ASC',
            },
          });

          // Asignar payments inmediatamente
          policiesBatch.forEach(policy => {
            policy.payments = paymentsInBatch.filter(payment => payment.policy_id === policy.id);
          });

          // Liberar memoria
          paymentsInBatch.length = 0;
        }
      }

      // 6. Asignar pólizas paginadas al asesor
      advisorParsed.policies = policies || [];

      // 7. Retornar con metadata de paginación
      return {
        advisor: advisorParsed,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalPolicies,
          totalPages,
          hasMore: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //4: Método para actualizar un asesor
  public updateAvisor = async (
    id: number,
    updateData: Partial<AdvisorEntity>,
  ): Promise<AdvisorEntity> => {
    try {
      const advisor: AdvisorEntity = await this.advisdorRepository.findOne({
        where: { id },
      });
      if (!advisor) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontró el cliente',
        });
      }

      // Normalizar fecha si existe
      if (updateData.birthdate) {
        const birthday = DateHelper.normalizeDateForDB(updateData.birthdate);
        updateData.birthdate = birthday;
      }

      // Convertir a mayúsculas solo si los campos existen
      if (updateData.firstName) updateData.firstName = updateData.firstName.toUpperCase();
      if (updateData.secondName) updateData.secondName = updateData.secondName.toUpperCase();
      if (updateData.surname) updateData.surname = updateData.surname.toUpperCase();
      if (updateData.secondSurname) updateData.secondSurname = updateData.secondSurname.toUpperCase();
      // Validar y asignar solo las propiedades permitidas de updateData
      Object.assign(advisor, updateData);
      // Guardar el cliente actualizado en la base de datos
      await this.advisdorRepository.save(advisor);

      // Limpiar todas las claves de caché relevantes
      await this.redisService.del(`advisor:${id}`);
      await this.redisService.del(`advisor:${id}:optimized`);
      await this.redisService.del(`advisor:${id}:basic`);
      await this.redisService.del('allAdvisors');

      // Obtener el asesor actualizado con todas sus relaciones
      const advisorWithRelations: AdvisorEntity = await this.advisdorRepository.findOne({
        where: { id },
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
  };
}
