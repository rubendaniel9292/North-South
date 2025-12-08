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

interface AdvisorWithPoliciesPagination {
  advisor: AdvisorEntity;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

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
      console.log('🔍 Consultando asesores desde BD...');
      const startTime = Date.now();

      try {
        const allAdvisors: AdvisorEntity[] = await this.advisdorRepository.find({
          where: whereConditions.length ? whereConditions : undefined,
          order: {
            id: 'DESC',
          },
          relations: [
            'policies', // Solo cargar policies básicas, sin relaciones anidadas
          ],
          select: {
            'policies': { id: true, numberPolicy: true } // Solo ID y número para contar
          }
        });

        const endTime = Date.now();
        console.log(`✅ Asesores cargados en ${endTime - startTime}ms (${allAdvisors.length} registros)`);

        // Solo guardar en caché si no hubo búsqueda
        if (!search) {
          await this.redisService.set(
            'allAdvisors',
            JSON.stringify(allAdvisors),
            32400,
          ); // TTL de 9 horas
          console.log(`💾 Asesores cacheados (TTL: 9h)`);
        }

        return allAdvisors;
      } catch (dbError) {
        console.error('❌ ERROR al consultar asesores:', dbError.message);
        console.error('Stack:', dbError.stack);
        throw ErrorManager.createSignatureError(`Error al consultar asesores: ${dbError.message}`);
      }
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

  //3.1: Método OPTIMIZADO VERSION ORIGINAL - Solo paginación sin filtros
  public getAdvisorByIdOptimizedSimple = async (
    id: number,
    page: number = 1,
    limit: number = 10
  ): Promise<AdvisorWithPoliciesPagination> => {
    try {
      // 1. Cargar datos básicos del asesor
      const cacheKey = `advisor:${id}:basic`;
      let advisorData = await this.redisService.get(cacheKey);

      if (!advisorData) {
        const advisor = await this.advisdorRepository.findOne({
          where: { id },
          relations: ['commissionRefunds', 'commissions', 'commissions.statusAdvance'],
        });

        if (!advisor) {
          throw new ErrorManager({
            type: 'BAD_REQUEST',
            message: 'No se encontró el asesor',
          });
        }

        await this.redisService.set(cacheKey, JSON.stringify(advisor), 1800);
        advisorData = JSON.stringify(advisor);
      }

      const advisor = JSON.parse(advisorData);

      // CASO ESPECIAL: Si limit=0, devolver solo el asesor sin pólizas
      if (limit === 0) {
        advisor.policies = [];
        return {
          advisor,
          pagination: {
            currentPage: 1,
            itemsPerPage: 0,
            totalItems: 0,
            totalPages: 0,
            hasMore: false,
            hasPrevious: false,
          },
        };
      }

      // 2. Contar pólizas
      const policyRepository = this.advisdorRepository.manager.getRepository(PolicyEntity);
      const totalPolicies = await policyRepository.count({
        where: { advisor_id: id },
      });

      // 3. Calcular paginación
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalPolicies / limit);

      // 4. Cargar pólizas con relaciones necesarias
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
        order: { id: 'DESC' },
        skip,
        take: limit,
      });

      // 5. Cargar payments mínimos
      const paymentRepository = this.advisdorRepository.manager.getRepository(PaymentEntity);
      
      for (const policy of policies) {
        const payments = await paymentRepository.find({
          where: { policy_id: policy.id },
          select: ['id', 'number_payment', 'value', 'status_payment_id', 'total', 'pending_value'],
          order: { number_payment: 'ASC' }
        });
        
        policy.payments = payments;
      }

      // 6. Asignar pólizas al asesor
      advisor.policies = policies;

      // 7. Retornar
      return {
        advisor,
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
      console.error('Error en getAdvisorByIdOptimizedSimple:', error);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3.2: Método ULTRA OPTIMIZADO - Paginación con filtros dinámicos (versión con filtros)
  public getAdvisorByIdOptimized = async (
    id: number,
    page: number = 1,
    limit: number = 10,
    customerId?: number,
    policyId?: number,
    search?: string
  ): Promise<AdvisorWithPoliciesPagination> => {
    try {
      // 1. Cargar datos básicos del asesor (solo primera vez)
      const cacheKey = `advisor:${id}:basic`;
      let advisorData = await this.redisService.get(cacheKey);

      if (!advisorData) {
        const advisor = await this.advisdorRepository.findOne({
          where: { id },
          relations: ['commissionRefunds', 'commissions', 'commissions.statusAdvance'],
        });

        if (!advisor) {
          throw new ErrorManager({
            type: 'BAD_REQUEST',
            message: 'No se encontró el asesor',
          });
        }

        await this.redisService.set(cacheKey, JSON.stringify(advisor), 1800);
        advisorData = JSON.stringify(advisor);
      }

      const advisor = JSON.parse(advisorData);

      // ✅ CASO ESPECIAL: Si limit=0, devolver solo el asesor sin pólizas
      if (limit === 0) {
        advisor.policies = [];
        return {
          advisor,
          pagination: {
            currentPage: 1,
            itemsPerPage: 0,
            totalItems: 0,
            totalPages: 0,
            hasMore: false,
            hasPrevious: false,
          },
        };
      }

      // 2. Construir condiciones de filtrado dinámicamente
      const policyRepository = this.advisdorRepository.manager.getRepository(PolicyEntity);

      // Objeto de condiciones base
      const whereConditions: any = { advisor: { id } };

      // ✅ Agregar filtros opcionales usando relaciones
      if (customerId) {
        whereConditions.customer = { id: Number(customerId) };
      }

      if (policyId) {
        whereConditions.id = Number(policyId);
      }

      if (search) {
        whereConditions.numberPolicy = Like(`%${search}%`);
      }

      // 3. Contar pólizas con filtros aplicados
      const totalPolicies = await policyRepository.count({
        where: whereConditions,
      });

      // 4. Calcular paginación
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalPolicies / limit);

      // 5. Cargar pólizas con filtros y relaciones necesarias (SIN payments aún)
      const policies = await policyRepository.find({
        where: whereConditions,
        relations: [
          'company',
          'customer',
          'periods',
          'renewals',
          'commissions',
          'commissionRefunds',
        ],
        order: { id: 'DESC' },
        skip,
        take: limit,
      });

      // 6. Cargar payments MÍNIMOS de forma controlada (igual que en el método simple)
      const paymentRepository = this.advisdorRepository.manager.getRepository(PaymentEntity);
      
      for (const policy of policies) {
        const payments = await paymentRepository.find({
          where: { policy_id: policy.id },
          select: ['id', 'number_payment', 'value', 'status_payment_id', 'total', 'pending_value'],
          order: { number_payment: 'ASC' }
        });
        
        policy.payments = payments;
      }

      // 7. Asignar pólizas al asesor
      advisor.policies = policies;

      // 8. Retornar con metadata de paginación
      return {
        advisor,
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
      console.error('Error en getAdvisorByIdOptimized:', error);
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
