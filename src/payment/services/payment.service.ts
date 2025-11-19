import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { PaymentDTO } from '../dto/payment.dto';
import { PaymentEntity } from '../entity/payment.entity';
import { PaymentStatusEntity } from '../entity/payment.status.entity';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { DateHelper } from '@/helpers/date.helper';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,

    @InjectRepository(PaymentStatusEntity)
    private readonly paymentStatusRepository: Repository<PaymentStatusEntity>,

    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
    private readonly redisService: RedisModuleService,
  ) { }

  private async invalidatePolicyRelatedCache(policy: PolicyEntity) {
    try {
      // Cachés básicos de la póliza
      await this.redisService.del(`policy:${policy.id}`);
      await this.redisService.del('policies');
      await this.redisService.del('payments');
      await this.redisService.del('paymentsByStatus:general');
      await this.redisService.del(`policy:${policy.id}:periods`);
      await this.redisService.del(`policy:${policy.id}:renewals`);
      await this.redisService.del(`policy:${policy.id}:commissions`);
      await this.redisService.del('GLOBAL_ALL_POLICIES_BY_STATUS');

      // Cachés por compañía (si existe)
      if (policy.company?.id) {
        await this.redisService.del(`paymentsByStatus:${policy.company.id}`);
      }

      // Cachés del asesor (si existe)
      if (policy.advisor_id) {
        await this.redisService.del(`advisor:${policy.advisor_id}`);
        await this.redisService.del('allAdvisors');
        await this.redisService.del(`advisor:${policy.advisor_id}:policies`);
        await this.redisService.del(`advisor:${policy.advisor_id}:policies.periods`);
        await this.redisService.del(`advisor:${policy.advisor_id}:periods`);
        await this.redisService.del(`commissions:${policy.advisor_id}`);
      }

      // Cachés de renovaciones (si existen)
      if (policy.renewals && policy.renewals.length > 0) {
        for (const renewal of policy.renewals) {
          await this.redisService.del(`renewal:${renewal.id}`);
          await this.redisService.del(`policyRenewal:${policy.id}:${renewal.id}`);
        }
      }
    } catch (error) {
      console.warn('Warning: Could not invalidate some cache keys:', error.message);
    }
  }
  //1: metodo para registrar un pago de poliza

  public createPayment = async (body: PaymentDTO): Promise<PaymentEntity> => {
    try {
      // validar si la póliza existe antes de registrar el pago.
      const policy = await this.policyRepository.findOne({
        where: { id: body.policy_id },
        relations: ['payments', 'renewals', 'periods']
      });

      if (!policy) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró la póliza',
        });
      }

      // Si no se proporciona un número de pago, calcular el siguiente número secuencial
      if (!body.number_payment) {
        // Obtener todos los pagos de la póliza, sin filtrar por renovación
        const allPayments = policy.payments || [];

        // Encontrar el número más alto de pago existente
        const maxPaymentNumber = allPayments.length > 0
          ? Math.max(...allPayments.map(p => p.number_payment))
          : 0;

        // El siguiente número de pago es el máximo + 1
        body.number_payment = maxPaymentNumber + 1;

        console.log(`Asignando número de pago secuencial: ${body.number_payment}`);

      } else {
        // Si se proporciona un número de pago, verificar que no exista ya
        if (policy.payments && policy.payments.length > 0) {
          const existingPayment = policy.payments.find(p => p.number_payment === body.number_payment);

          if (existingPayment) {
            console.log(`Ya existe un pago con número ${body.number_payment} para esta póliza.`);
            throw new ErrorManager({
              type: 'BAD_REQUEST',
              message: `Ya existe un pago con número ${body.number_payment} para esta póliza.`,
            });
          }
        }
      }

      // Si no se proporciona una fecha de creación, usar la fecha actual normalizada
      if (!body.createdAt) {
        body.createdAt = DateHelper.normalizeDateForDB(new Date());
      } else {
        // Si se proporciona una fecha, normalizarla
        body.createdAt = DateHelper.normalizeDateForComparison(body.createdAt);
      }


      const newPayment = await this.paymentRepository.save(body);
      // INVALIDAR caché relacionado
      await this.invalidatePolicyRelatedCache(policy);
      return newPayment;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //1.5: metodo optimizado para verificar si existen pagos pendientes sin cargar todos los datos
  public checkPendingPaymentsExist = async (): Promise<boolean> => {
    try {
      // Consulta optimizada usando find() con count - sin cargar objetos completos
      const count = await this.paymentRepository.count({
        where: {
          pending_value: MoreThan(0)
        }
      });

      return count > 0;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2: metodo para consultar todos los pagos de las polizas
  public getAllPayments = async (): Promise<PaymentEntity[]> => {
    try {

      const cachedPayments = await this.redisService.get('payments');
      if (cachedPayments) {
        return JSON.parse(cachedPayments);
      }
      const payments: PaymentEntity[] = await this.paymentRepository.find({
        order: {
          id: 'DESC',
        },
        relations: [
          'policies',
          'policies.periods',
          'paymentStatus',
          'policies.paymentFrequency',
          'policies.payments',
        ],
        select: {

          policies: {
            id: true,
            numberPolicy: true,

          },
        },
      });
      if (!payments || payments.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      await this.redisService.set('payments', JSON.stringify(payments), 32400);
      return payments;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2.1: método PAGINADO para evitar memory leak - reemplaza getAllPayments en el controlador
  public getPaymentsPaginated = async (limit: number = 50, offset: number = 0): Promise<PaymentEntity[]> => {
    try {
      const payments: PaymentEntity[] = await this.paymentRepository.find({
        take: limit,
        skip: offset,
        order: {
          id: 'DESC',
        },
        relations: [
          'policies',
          'paymentStatus',
        ],
        select: {
          id: true,
          value: true,
          pending_value: true,
          number_payment: true,
          createdAt: true,
          policies: {
            id: true,
            numberPolicy: true,
          },
        },
      });

      return payments || [];
    } catch (error) {
      console.error('Error obteniendo pagos paginados:', error);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2.2: método para obtener pagos de una póliza específica
  public getPaymentsByPolicy = async (policyId: number): Promise<PaymentEntity[]> => {
    try {
      const payments: PaymentEntity[] = await this.paymentRepository.find({
        where: { policy_id: policyId },
        order: { number_payment: 'ASC' },
        relations: ['policies', 'paymentStatus'],
        select: {
          id: true,
          value: true,
          pending_value: true,
          number_payment: true,
          createdAt: true,
          balance: true,
          total: true,
          policies: {
            id: true,
            numberPolicy: true,
          },
        },
      });

      return payments || [];
    } catch (error) {
      console.error('Error obteniendo pagos por póliza:', error);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2.3: método para buscar pagos por número de póliza o ID
  public searchPayments = async (searchTerm: string): Promise<PaymentEntity[]> => {
    try {
      const isNumeric = /^\d+$/.test(searchTerm);

      if (isNumeric) {
        // Buscar por ID de pago o número de póliza
        const payments: PaymentEntity[] = await this.paymentRepository.find({
          where: [
            { id: parseInt(searchTerm) },
            { policies: { numberPolicy: searchTerm } },
            { policies: { id: parseInt(searchTerm) } }
          ],
          order: { id: 'DESC' },
          relations: ['policies', 'paymentStatus'],
          select: {
            id: true,
            value: true,
            pending_value: true,
            number_payment: true,
            createdAt: true,
            policies: {
              id: true,
              numberPolicy: true,
            },
          },
        });

        return payments || [];
      } else {
        // Buscar por número de póliza (texto)
        const payments: PaymentEntity[] = await this.paymentRepository.find({
          where: {
            policies: {
              numberPolicy: searchTerm
            }
          },
          order: { id: 'DESC' },
          relations: ['policies', 'paymentStatus'],
          select: {
            id: true,
            value: true,
            pending_value: true,
            number_payment: true,
            createdAt: true,
            policies: {
              id: true,
              numberPolicy: true,
            },
          },
        });

        return payments || [];
      }
    } catch (error) {
      console.error('Error buscando pagos:', error);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2.4: método para obtener pagos por estado específico (ID)
  public getPaymentsByStatusId = async (statusId: number): Promise<PaymentEntity[]> => {
    try {
      const payments: PaymentEntity[] = await this.paymentRepository.find({
        where: { status_payment_id: statusId },
        order: { id: 'DESC' },
        relations: ['policies', 'paymentStatus'],
        select: {
          id: true,
          value: true,
          pending_value: true,
          number_payment: true,
          createdAt: true,
          policies: {
            id: true,
            numberPolicy: true,
          },
        },
      });

      return payments || [];
    } catch (error) {
      console.error('Error obteniendo pagos por estado:', error);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  /**
   * Método optimizado para obtener SOLO pagos con pending_value > 0
   * Evita cargar todos los 3400+ pagos en memoria
   * Solo carga los que realmente necesitan procesamiento
   */
  public getPaymentsWithPendingValue = async (): Promise<PaymentEntity[]> => {
    try {
      const payments: PaymentEntity[] = await this.paymentRepository.find({
        where: {
          pending_value: MoreThan(0) // Solo pagos con saldo pendiente
        },
        relations: [
          'policies',
          'policies.renewals',
          'policies.periods',
          'policies.payments', // Necesario para cálculos del scheduler
          'paymentStatus',
          'policies.paymentFrequency',
        ],
        select: {
          policies: {
            id: true,
            numberPolicy: true,
            policyValue: true,
            numberOfPayments: true,
            policy_status_id: true,
          },
        },
      });

      return payments || [];
    } catch (error) {
      console.error('Error obteniendo pagos con saldo pendiente:', error);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  /**
   * Método paginado para obtener pagos con pending_value > 0 por lotes
   * Permite procesamiento escalable sin crash de memoria
   */
  public getPaymentsWithPendingValuePaginated = async (limit: number = 50, offset: number = 0): Promise<PaymentEntity[]> => {
    try {
      const payments: PaymentEntity[] = await this.paymentRepository.find({
        where: {
          pending_value: MoreThan(0) // Solo pagos con saldo pendiente
        },
        relations: [
          'policies',
          'policies.renewals',
          'policies.periods',
          'policies.payments', // CRÍTICO: Necesario para el scheduler (calcular último pago, ciclo actual)
          'paymentStatus',
          'policies.paymentFrequency',
        ],
        select: {
          policies: {
            id: true,
            numberPolicy: true,
            policyValue: true,
            numberOfPayments: true,
            policy_status_id: true,
          },
        },
        take: limit,
        skip: offset,
        order: { id: 'ASC' } // Orden consistente para paginación
      });

      return payments || [];
    } catch (error) {
      console.error('Error obteniendo pagos paginados con saldo pendiente:', error);
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  /**
   * Cuenta el total de pólizas con pagos pendientes para calcular lotes
   */
  public countPoliciesWithPendingPayments = async (): Promise<number> => {
    try {
      const count = await this.paymentRepository.count({
        where: {
          pending_value: MoreThan(0)
        }
      });

      return count;
    } catch (error) {
      console.error('Error contando pólizas con pagos pendientes:', error);
      return 0;
    }
  };

  //3: metodo para obtener los pagos por id
  public getPaymentsId = async (id: number): Promise<PaymentEntity> => {
    try {

      const paymentId: PaymentEntity = await this.paymentRepository.findOne({
        where: { id },
        relations: ['policies', 'policies.periods', 'paymentStatus'],
        select: {
          policies: {
            id: true,
            numberPolicy: true,
          },
        },
      });
      console.log('PAGO OBTENIDO:', paymentId);

      if (!paymentId) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      return paymentId;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //4: metodo para obtener los estados de los pagos
  public getPaymentStatus = async (): Promise<PaymentStatusEntity[]> => {
    try {

      const cachedPayments = await this.redisService.get('paymentStatus');
      if (cachedPayments) {
        return JSON.parse(cachedPayments);
      }

      const paymentStatus = await this.paymentStatusRepository.find();

      if (!paymentStatus) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      await this.redisService.set(
        'paymentStatus',
        JSON.stringify(paymentStatus),
        32400,
      ); // TTL de 9 horas

      return paymentStatus;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //5: metodo para obtener los pagos en base al estado
  public getPaymentsByStatus = async (
    companyId?: number,
  ): Promise<PaymentEntity[]> => {
    try {

      const cacheKey = companyId
        ? `paymentsByStatus:${companyId}`
        : 'paymentsByStatus:general';

      const cachedPayments = await this.redisService.get(cacheKey);
      if (cachedPayments) {
        return JSON.parse(cachedPayments);
      }

      // condiciones de búsqueda
      const whereConditions: any = {
        status_payment_id: 1, // Estado: atrasado
      };
      // Si se proporciona un companyId, añade la condición de la compañía
      if (companyId) {
        whereConditions['policies.company.id'] = companyId;
      }
      const paymentsByStatus: PaymentEntity[] =
        await this.paymentRepository.find({
          where: whereConditions,
          relations: [
            'policies',
            'policies.customer',
            'policies.company',
            'policies.advisor',
            'paymentStatus',
          ],
          select: {
            id: true,
            value: true,
            createdAt: true,
            policies: {
              id: true,
              numberPolicy: true,
              policyValue: true,
              policyType: {
                policyName: true,
              },
              customer: {
                numberPhone: true,
                firstName: true,
                secondName: true,
                surname: true,
                secondSurname: true,
              },
              company: {
                id: true,
                companyName: true,
              },
              advisor: {
                firstName: true,
                secondName: true,
                surname: true,
                secondSurname: true,
              },
            },
          },
        });
      if (!paymentsByStatus || paymentsByStatus.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      await this.redisService.set(
        cacheKey,
        JSON.stringify(paymentsByStatus),
        32400,
      ); // TTL de 9 horas

      return paymentsByStatus;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //6: metodo para actualizar el pago
  public updatePayment = async (
    id: number,
    updateData: Partial<PaymentDTO>,
  ): Promise<PaymentEntity> => {
    try {
      const payment = await this.paymentRepository.findOne({ where: { id }, relations: ['policies', 'policies.company', 'policies.advisor'] });
      if (!payment) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró el pago',
        });
      }

      // Actualizar timestamp
      updateData.updatedAt = DateHelper.normalizeDateForDB(new Date());

      // Aplicar cambios
      Object.assign(payment, updateData);

      // Validar que pending_value no sea negativo después de actualizar
      if (payment.pending_value < 0) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'El valor pendiente no puede ser negativo',
        });
      }

      const paymentUpdated = await this.paymentRepository.save(payment);

      // INVALIDAR TODAS LAS KEYS RELACIONADAS
      const policy = payment.policies;
      await this.invalidatePolicyRelatedCache(policy);

      return paymentUpdated;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  // 7:  método para obtener póliza con pagos actualizados
  public async getPolicyWithPayments(id: number): Promise<PolicyEntity> {
    try {

      const policy = await this.policyRepository.findOne({
        where: { id },
        relations: [
          'policyStatus',
          'paymentFrequency',
          'payments',
          'renewals',
          'payments.paymentStatus',
        ],

        order: {
          payments: {
            number_payment: 'ASC',
          },

        },
      });

      if (!policy || !policy.payments || policy.payments.length === 0) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró la póliza',
        });
      }
      return policy;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

}
