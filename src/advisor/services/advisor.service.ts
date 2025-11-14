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

  //3.1: Método ULTRA-OPTIMIZADO - Solo datos esenciales, SIN relations pesadas
  public getAdvisorByIdOptimized = async (
    id: number, 
    page: number = 1, 
    limit: number = 20  // Reducido a 20 para máxima seguridad
  ): Promise<any> => {
    try {
      // 1. Cargar datos básicos del asesor SIN relations pesadas
      const advisorData = await this.advisdorRepository.findOne({
        where: { id },
        select: ['id', 'firstName', 'secondName', 'surname', 'secondSurname', 'ci_ruc', 'email'],
      });

      if (!advisorData) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró el asesor',
        });
      }

      // 2. Cargar comisiones del asesor por separado (ligero)
      const commissionsRepo = this.advisdorRepository.manager.getRepository('CommissionsPaymentsEntity');
      const commissions = await commissionsRepo.find({
        where: { advisor_id: id },
        select: ['id', 'receiptNumber', 'advanceAmount', 'createdAt', 'observations', 'policy_id', 'status_advance_id'],
      });

      // 3. Contar pólizas
      const policyRepository = this.advisdorRepository.manager.getRepository(PolicyEntity);
      const totalPolicies = await policyRepository.count({
        where: { advisor_id: id },
      });

      // 4. Calcular paginación
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalPolicies / limit);

      // 5. Cargar SOLO datos esenciales de pólizas (SIN relations)
      const policies = await policyRepository.find({
        where: { advisor_id: id },
        select: [
          'id', 'numberPolicy', 'policyValue', 'paymentsToAdvisor', 
          'numberOfPaymentsAdvisor', 'isCommissionAnnualized', 'renewalCommission',
          'company_id', 'customers_id'
        ],
        order: { id: 'DESC' },
        skip,
        take: limit,
      });

      if (policies.length === 0) {
        return {
          advisor: { ...advisorData, commissions, policies: [] },
          pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: totalPolicies,
            totalPages,
            hasMore: false,
            hasPrevious: page > 1,
          },
        };
      }

      const policyIds = policies.map(p => p.id);

      // 6. Cargar datos relacionados POR SEPARADO y de forma ULTRA-LIGERA
      const [companies, customers, periods, renewals, policyCommissions, payments] = await Promise.all([
        // Companies
        this.advisdorRepository.manager.query(
          `SELECT id, companyName, ci_ruc FROM company WHERE id IN (SELECT DISTINCT company_id FROM policy WHERE id IN (${policyIds.join(',')}))`
        ),
        // Customers
        this.advisdorRepository.manager.query(
          `SELECT id, firstName, secondName, surname, secondSurname FROM customers WHERE id IN (SELECT DISTINCT customers_id FROM policy WHERE id IN (${policyIds.join(',')}))`
        ),
        // Periods
        this.advisdorRepository.manager.query(
          `SELECT id, policy_id, year FROM policy_periods WHERE policy_id IN (${policyIds.join(',')})`
        ),
        // Renewals
        this.advisdorRepository.manager.query(
          `SELECT id, policy_id, renewalNumber FROM policy_renewals WHERE policy_id IN (${policyIds.join(',')})`
        ),
        // Policy commissions
        commissionsRepo.find({
          where: { policy_id: In(policyIds) },
          select: ['id', 'policy_id', 'advanceAmount', 'receiptNumber', 'createdAt'],
        }),
        // Payments (solo contar pagados)
        this.advisdorRepository.manager.query(
          `SELECT policy_id, status_payment_id, COUNT(*) as count, SUM(value) as total FROM payment WHERE policy_id IN (${policyIds.join(',')}) GROUP BY policy_id, status_payment_id`
        ),
      ]);

      // 7. Mapear datos relacionados
      const companiesMap = new Map(companies.map(c => [c.id, c]));
      const customersMap = new Map(customers.map(c => [c.id, c]));
      const periodsMap = new Map();
      periods.forEach(p => {
        if (!periodsMap.has(p.policy_id)) periodsMap.set(p.policy_id, []);
        periodsMap.get(p.policy_id).push(p);
      });
      const renewalsMap = new Map();
      renewals.forEach(r => {
        if (!renewalsMap.has(r.policy_id)) renewalsMap.set(r.policy_id, []);
        renewalsMap.get(r.policy_id).push(r);
      });
      const commissionsMap = new Map();
      policyCommissions.forEach(c => {
        if (!commissionsMap.has(c.policy_id)) commissionsMap.set(c.policy_id, []);
        commissionsMap.get(c.policy_id).push(c);
      });
      const paymentsMap = new Map();
      payments.forEach(p => {
        if (!paymentsMap.has(p.policy_id)) paymentsMap.set(p.policy_id, []);
        paymentsMap.get(p.policy_id).push(p);
      });

      // 8. Ensamblar pólizas con datos relacionados
      const enrichedPolicies = policies.map(policy => ({
        ...policy,
        company: companiesMap.get(policy.company_id) || null,
        customer: customersMap.get(policy.customers_id) || null,
        periods: periodsMap.get(policy.id) || [],
        renewals: renewalsMap.get(policy.id) || [],
        commissions: commissionsMap.get(policy.id) || [],
        paymentsStats: paymentsMap.get(policy.id) || [], // Solo estadísticas, no todos los payments
      }));

      // 9. Retornar
      return {
        advisor: {
          ...advisorData,
          commissions,
          policies: enrichedPolicies,
        },
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
