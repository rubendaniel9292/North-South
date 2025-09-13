import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, Not, IsNull } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { DateHelper } from '@/helpers/date.helper';
import { CustomersEntity } from '../entities/customer.entity';
import { ValidateEntity } from '@/helpers/validations';
import { CustomerDTO } from '../dto/customer.dto';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import {
  EliminationEvaluationResult,
  LOPDException,
  PolicyRetentionInfo,
  LegalRetentionRequirement
} from '../types/lopd-evaluation.types';

@Injectable()
export class CustomersService extends ValidateEntity {
  constructor(
    @InjectRepository(CustomersEntity)
    private readonly customerRepository: Repository<CustomersEntity>,
    private readonly redisService: RedisModuleService,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(customerRepository);
  }
  //1:metodo para registrar un cliente
  public createCustomer = async (
    body: CustomerDTO,
  ): Promise<CustomersEntity> => {
    try {
      // Primero validaR cédula y correo
      await this.validateInput(body, 'customer');
      body.firstName = body.firstName.toUpperCase();
      body.secondName = body?.secondName?.toUpperCase();
      body.surname = body?.surname?.toUpperCase();
      body.secondSurname = body?.secondSurname?.toUpperCase();

      // Normalizar fecha de nacimiento para almacenar correctamente en BD

      body.birthdate = DateHelper.normalizeDateForDB(body.birthdate);


      const newCustomer = await this.customerRepository.save(body);

      console.log('Cliente guardado', newCustomer);
      // Invalida la caché de la lista de clientes
      await this.redisService.del('customers');

      return newCustomer;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: Método para obtener todos los clientes con las relaciones
  public getAllCustomers = async (
    search?: string,
  ): Promise<CustomersEntity[]> => {
    try {
      // Verificar si los datos están en Redis

      const cachedCustomer = await this.redisService.get('customers');
      if (cachedCustomer) {
        return JSON.parse(cachedCustomer);
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

      const customers: CustomersEntity[] = await this.customerRepository.find({
        /*
        Objeto de selección: para  un control 
        más detallado sobre qué campos de las relaciones incluir en el resultado.
        */
        order: {
          id: "DESC",
        },
        where: whereConditions.length > 0 ? whereConditions : undefined,
        relations: ['civil', 'city', 'province', 'policies'],
        select: {
          civil: {
            id: true,
            status: true, // Solo selecciona el campo 'status', no el 'id'
          },
          city: {
            id: true,
            cityName: true, // Selecciona solo el nombre de la ciudad
          },
          province: {
            id: true,
            provinceName: true, // Selecciona solo el nombre de la provincia
          },
        },
      });

      if (!customers.length) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }


      await this.redisService.set(
        'customers',
        JSON.stringify(customers),
        32400,
      ); // TTL de 9 horas

      return customers;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //:3 Método para obtener todos los clientes con las relaciones por id
  public getCustomerById = async (id: number): Promise<CustomersEntity> => {
    try {

      const cachedCustomer = await this.redisService.get(`customer:${id}`);
      if (cachedCustomer) {
        return JSON.parse(cachedCustomer);
      }

      const customer: CustomersEntity = await this.customerRepository.findOne({
        where: { id },
        relations: [
          'civil',
          'city',
          'policies',
          'province',
          'policies.paymentFrequency',
          'policies.company',
          'policies.paymentMethod',
          'policies.policyStatus',
          'policies.policyType',
          'policies.advisor',
          'policies.bankAccount',
          'policies.bankAccount.bank',
          'policies.creditCard',
          'policies.creditCard.bank',
          'policies.payments',
          'policies.renewals',
        ],
        select: {
          city: {
            id: true,
            cityName: true, // Selecciona solo el nombre de la ciudad
          },
          province: {
            id: true,
            provinceName: true, // Selecciona solo el nombre de la provincia
          },
          civil: {
            id: true,
            status: true,
          },
          policies: {
            id: true,
            numberPolicy: true,
            coverageAmount: true,
            agencyPercentage: true,
            advisorPercentage: true,
            policyValue: true,
            numberOfPayments: true,
            startDate: true,
            endDate: true,
            paymentsToAdvisor: true,
            policyFee: true,
            renewalCommission: true,
            observations: true,
            bankAccount: {
              bank_id: true,
              bank: {
                bankName: true,
              },
            },
            creditCard: {
              bank_id: true,
              bank: {
                bankName: true,
              },
            },
          },
        },
      });
      if (!customer) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      await this.redisService.set(`customer:${id}`, JSON.stringify(customer), 32400);
      return customer;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //4: Método para actualizar un cliente  
  public updateCustomer = async (
    id: number,
    updateData: Partial<CustomersEntity>,
  ): Promise<CustomersEntity> => {
    try {
      const customer = await this.customerRepository.findOne({ where: { id } });
      if (!customer) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontró el cliente',
        });
      }

      // Convertir a mayúsculas y asignar de nuevo (solo si existen)
      if (updateData.firstName) updateData.firstName = updateData.firstName.toUpperCase();
      if (updateData.secondName) updateData.secondName = updateData?.secondName?.toUpperCase();
      if (updateData.surname) updateData.surname = updateData?.surname?.toUpperCase();
      if (updateData.secondSurname) updateData.secondSurname = updateData?.secondSurname?.toUpperCase();

      // Normalizar fecha de nacimiento si se está actualizando

      updateData.birthdate = DateHelper.normalizeDateForDB(updateData.birthdate);

      // Validar y asignar solo las propiedades permitidas de updateData
      Object.assign(customer, updateData);
      // Guardar el cliente actualizado en la base de datos
      const customerUpdated = await this.customerRepository.save(customer);

      // Limpiar todas las claves de caché relevantes

      await this.redisService.del(`customer:${id}`);
      await this.redisService.del('customers');

      // Actualizar caché con los datos más recientes
      await this.redisService.set(
        `customer:${id}`,
        JSON.stringify(customerUpdated),
        32400,
      );

      //console.log('Cliente actualizado:', customerUpdated);
      return customerUpdated;

    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  //5: Método para anonimizar un cliente (cumplimiento LOPD)
  public anonymizeCustomer = async (
    customerId: number,
    reason: string,
    legalBasis?: string,
    requestNumber?: string,
  ): Promise<{
    success: boolean;
    message: string;
    customerData: {
      id: number;
      isAnonymized: boolean;
      anonymizationDate: Date;
      requestNumber: string | null;
      activePoliciesCount: number;
    };
  }> => {
    try {
      // Verificar que el cliente existe
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
        relations: ['policies'],
      });

      if (!customer) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontró el cliente',
        });
      }

      // Verificar si ya está anonimizado
      if (customer.isAnonymized) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'El cliente ya fue anonimizado previamente',
        });
      }

      // Verificar que no existe otro cliente con el mismo número de solicitud
      if (requestNumber) {
        const existingRequest = await this.customerRepository.findOne({
          where: { requestNumber },
        });

        if (existingRequest && existingRequest.id !== customerId) {
          throw new ErrorManager({
            type: 'BAD_REQUEST',
            message: `El número de solicitud ${requestNumber} ya está siendo utilizado`,
          });
        }
      }

      // Verificar pólizas activas (opcional - para análisis legal)
      const activePolicies = customer.policies?.filter(
        policy => policy.policy_status_id !== 5 // Asumiendo que 5 = "Cancelada"
      ) || [];

      // Datos anonimizados
      const anonymizedData = {
        ci_ruc: `ANON_${Date.now()}_${customerId}`,
        firstName: 'CLIENTE',
        secondName: null,
        surname: 'ANONIMIZADO',
        secondSurname: null,
        birthdate: DateHelper.normalizeDateForDB('1900-01-01'),
        email: `anonimizado.${customerId}@sistema.local`,
        numberPhone: '000000000',
        address: 'DIRECCIÓN ANONIMIZADA',
        personalData: false, // Ya no contiene datos personales
        isAnonymized: true,
        anonymizationDate: DateHelper.normalizeDateForDB(new Date()),
        anonymizationReason: reason,
        legalBasisForRetention: legalBasis || 'USER_REQUEST',
        requestNumber: requestNumber || null, // Número de solicitud física
      };

      // Actualizar el cliente con datos anonimizados
      await this.customerRepository.update(customerId, anonymizedData);

      // Limpiar cachés relacionados
      await this.invalidateCustomerCaches(customerId);

      // Registrar en logs para auditoría
      const logMessage = requestNumber
        ? `✅ Cliente anonimizado: ID=${customerId}, Solicitud=${requestNumber}, Motivo=${reason}, Pólizas activas=${activePolicies.length}`
        : `✅ Cliente anonimizado: ID=${customerId}, Motivo=${reason}, Pólizas activas=${activePolicies.length}`;

      console.log(logMessage);

      return {
        success: true,
        message: requestNumber
          ? `Cliente anonimizado exitosamente bajo solicitud ${requestNumber}. ${activePolicies.length} pólizas activas requieren revisión legal.`
          : `Cliente anonimizado exitosamente. ${activePolicies.length} pólizas activas requieren revisión legal.`,
        customerData: {
          id: customerId,
          isAnonymized: true,
          anonymizationDate: anonymizedData.anonymizationDate,
          requestNumber: requestNumber || null,
          activePoliciesCount: activePolicies.length,
        },
      };

    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //6: Método para verificar si un cliente puede ser anonimizado
  public canCustomerBeAnonymized = async (
    customerId: number,
  ): Promise<{
    canAnonymize: boolean;
    restrictions: string[];
    activePolicies: number;
    suggestions: string[];
  }> => {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
        relations: ['policies', 'policies.policyStatus'],
      });

      if (!customer) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontró el cliente',
        });
      }

      const restrictions: string[] = [];
      const suggestions: string[] = [];

      // Verificar si ya está anonimizado
      if (customer.isAnonymized) {
        restrictions.push('El cliente ya fue anonimizado previamente');
      }

      // Analizar pólizas activas
      const activePolicies = customer.policies?.filter(
        policy => policy.policy_status_id != 2 && policy.policy_status_id != 3 // Estado cancelada y culimnadas
      ) || [];

      if (activePolicies.length > 0) {
        const policyDetails = activePolicies.map(policy => {
          const yearsRemaining = DateHelper.normalizeDateForComparison(new Date(policy.endDate)).getFullYear() - DateHelper.normalizeDateForComparison(new Date()).getFullYear();
          return `Póliza ${policy.numberPolicy} (${yearsRemaining} años restantes)`;
        });

        restrictions.push(`${activePolicies.length} pólizas activas: ${policyDetails.join(', ')}`);
        suggestions.push('Considere anonimización parcial manteniendo referencias contractuales');
        suggestions.push('Consulte base legal para retención durante vigencia del contrato');
      }

      // Verificar datos de pagos recientes
      const hasRecentActivity = activePolicies.some(policy => {
        const lastActivity = DateHelper.normalizeDateForComparison(new Date(policy.updatedAt));
        const thirtyDaysAgo = DateHelper.normalizeDateForComparison(new Date());
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastActivity > thirtyDaysAgo;
      });

      if (hasRecentActivity) {
        restrictions.push('Actividad reciente en pólizas (últimos 30 días)');
        suggestions.push('Espere período de inactividad antes de anonimizar');
      }

      const canAnonymize = restrictions.length === 0 ||
        (restrictions.length === 1 && restrictions[0].includes('pólizas activas'));

      return {
        canAnonymize,
        restrictions,
        activePolicies: activePolicies.length,
        suggestions,
      };

    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //7: Método para invalidar cachés relacionados con el cliente
  private invalidateCustomerCaches = async (customerId: number): Promise<void> => {
    try {
      // Cachés específicos del cliente
      await this.redisService.del(`customer:${customerId}`);

      // Cachés globales
      await this.redisService.del('customers');

      // Cachés relacionados con pólizas del cliente
      await this.redisService.del('allPolicies');
      await this.redisService.del('policyStatus:general');

      console.log(`🗑️ Cachés invalidados para cliente: ${customerId}`);

    } catch (error) {
      console.warn('Advertencia: No se pudieron invalidar algunos cachés:', error.message);
    }
  };

  //8: Método para obtener reporte de anonimizaciones
  public getAnonymizationReport = async (): Promise<{
    totalAnonymized: number;
    anonymizations: Array<{
      id: number;
      requestNumber: string | null;
      anonymizationDate: Date;
      anonymizationReason: string;
      legalBasisForRetention: string;
    }>;
  }> => {
    try {
      const anonymizedCustomers = await this.customerRepository.find({
        where: { isAnonymized: true },
        select: {
          id: true,
          requestNumber: true,
          anonymizationDate: true,
          anonymizationReason: true,
          legalBasisForRetention: true,
        },
        order: { anonymizationDate: 'DESC' },
      });

      return {
        totalAnonymized: anonymizedCustomers.length,
        anonymizations: anonymizedCustomers,
      };
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //9: 🔒 LOPD - Evaluación automática de solicitud de eliminación

  public evaluateEliminationRequest = async (
    customerId: number,
    requestNumber?: string
  ): Promise<EliminationEvaluationResult> => {
    try {
      // Obtener cliente con todas las relaciones necesarias
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
        relations: [
          'policies',
          'policies.policyStatus',
          'policies.policyType',
          'policies.payments',
          'policies.renewals'
        ],
      });

      if (!customer) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontró el cliente',
        });
      }

      const exceptions: LOPDException[] = [];
      let earliestEliminationDate: Date | undefined;

      // 📋 VERIFICAR ART. 18.2 - OBLIGACIÓN CONTRACTUAL (pólizas activas)
      const activePolicies = customer.policies?.filter(
        policy => policy.policy_status_id != 2 && policy.policy_status_id != 3 // Estado cancelada y culimnadas
      ) || [];

      if (activePolicies.length > 0) {
        // Encontrar la fecha de vencimiento más lejana
        let latestEndDate = DateHelper.normalizeDateForComparison(new Date());
        for (const policy of activePolicies) {
          const endDate = DateHelper.normalizeDateForComparison(new Date(policy.endDate));
          if (endDate > latestEndDate) {
            latestEndDate = endDate;
          }
        }

        exceptions.push({
          article: 'Art. 18.2 LOPD',
          reason: 'Obligación contractual vigente',
          details: `${activePolicies.length} pólizas activas. Vencimiento más lejano: ${latestEndDate.toLocaleDateString()}`,
          blocksElimination: true,
        });

        // Programar fecha más temprana para eliminación después del vencimiento contractual
        earliestEliminationDate = DateHelper.normalizeDateForComparison(new Date(latestEndDate));
      }

      // 📋 VERIFICAR ART. 18.5 - DERECHOS DE TERCEROS (beneficiarios)
      const activePoliciesWithBeneficiaries = activePolicies.filter(
        policy => policy.policyType?.policyName?.toLowerCase().includes('vida') ||
          policy.policyType?.policyName?.toLowerCase().includes('beneficiar')
      );

      if (activePoliciesWithBeneficiaries.length > 0) {
        exceptions.push({
          article: 'Art. 18.5 LOPD',
          reason: 'Protección de derechos de terceros',
          details: `${activePoliciesWithBeneficiaries.length} pólizas con posibles beneficiarios`,
          blocksElimination: true,
        });
      }

      // Determinar acción recomendada
      const canEliminate = exceptions.length === 0;
      const recommendedAction = canEliminate ? 'PROCEDER' : 'RECHAZAR';

      // Generar respuesta legal
      let legalResponse: string;
      if (canEliminate) {
        legalResponse = `Su solicitud de eliminación PROCEDE conforme al Art. 15 de la Ley Orgánica de Protección de Datos Personales. La anonimización podrá ejecutarse manualmente por el administrador dentro de los próximos 15 días calendario, cumpliendo con los métodos técnicos requeridos para dejar los datos irreconocibles de forma definitiva y segura.`;
      } else {
        legalResponse = `Su solicitud ha sido evaluada conforme al Art. 15 de la LOPD. NO PROCEDE la eliminación inmediata debido a las siguientes excepciones legales establecidas en el Art. 18:\n\n`;

        exceptions.forEach((exception, index) => {
          legalResponse += `${index + 1}. ${exception.article}: ${exception.reason}\n   Detalle: ${exception.details}\n\n`;
        });

        if (earliestEliminationDate) {
          legalResponse += `La eliminación podrá ser considerada nuevamente a partir del ${earliestEliminationDate.toLocaleDateString()}, una vez cumplidas las obligaciones legales y contractuales. Será necesaria una nueva evaluación y autorización manual del administrador.\n\n`;
        }

        legalResponse += `Esta decisión se fundamenta en el marco legal vigente y protege tanto sus derechos como las obligaciones contractuales y legales aplicables.`;
      }

      // Registrar solicitud en el cliente
      await this.customerRepository.update(customerId, {
        eliminationRequestDate: DateHelper.normalizeDateForDB(new Date()),
        eliminationEvaluationResult: JSON.stringify({
          canEliminate,
          exceptions,
          evaluationDate: DateHelper.normalizeDateForDB(new Date()),
          requestNumber,
        }),
        earliestEliminationDate: earliestEliminationDate || null,
      });

      const result: EliminationEvaluationResult = {
        canEliminate,
        exceptions,
        recommendedAction,
        legalResponse,
        earliestEliminationDate,
        activePoliciesCount: activePolicies.length,
      };

      console.log(`📊 Evaluación LOPD - Cliente ${customerId}: ${recommendedAction}`, {
        exceptions: exceptions.length,
        activePolicies: activePolicies.length,
      });

      return result;

    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  //10: 📅 LOPD - Consultar clientes elegibles para eliminación manual
  public getEliminationEligibleCustomers = async (): Promise<{
    readyForElimination: any[];
    pendingElimination: any[];
    totalRequests: number;
  }> => {
    try {
      const currentDate = new Date();

      // Buscar clientes con solicitudes de eliminación
      const customersWithRequests = await this.customerRepository.find({
        where: {
          eliminationRequestDate: Not(IsNull()),
          isAnonymized: false, // No anonimizados aún
        },
        relations: ['policies'],
        select: [
          'id', 'firstName', 'surname', 'ci_ruc', 'email',
          'eliminationRequestDate', 'earliestEliminationDate',
          'eliminationEvaluationResult'
        ],
      });

      const readyForElimination = [];
      const pendingElimination = [];

      for (const customer of customersWithRequests) {
        const evaluationResult = customer.eliminationEvaluationResult
          ? JSON.parse(customer.eliminationEvaluationResult)
          : null;

        const customerInfo = {
          id: customer.id,
          name: `${customer.firstName} ${customer.surname}`,
          ci_ruc: customer.ci_ruc,
          email: customer.email,
          requestDate: customer.eliminationRequestDate,
          earliestEliminationDate: customer.earliestEliminationDate,
          canEliminate: evaluationResult?.canEliminate || false,
          activePolicies: customer.policies?.filter(p => p.policy_status_id !== 5).length || 0,
          daysSinceRequest: Math.floor((currentDate.getTime() - DateHelper.normalizeDateForComparison(new Date(customer.eliminationRequestDate)).getTime()) / (1000 * 60 * 60 * 24)),
        };

        // Si puede eliminarse O si ya pasó la fecha mínima
        if (evaluationResult?.canEliminate ||
          (customer.earliestEliminationDate && DateHelper.normalizeDateForComparison(new Date(customer.earliestEliminationDate)) <= currentDate)) {
          readyForElimination.push(customerInfo);
        } else {
          pendingElimination.push(customerInfo);
        }
      }

      return {
        readyForElimination: readyForElimination.sort((a, b) => b.daysSinceRequest - a.daysSinceRequest),
        pendingElimination: pendingElimination.sort((a, b) => DateHelper.normalizeDateForComparison(new Date(a.earliestEliminationDate)).getTime() - DateHelper.normalizeDateForComparison(new Date(b.earliestEliminationDate)).getTime()),
        totalRequests: customersWithRequests.length
      };

    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}