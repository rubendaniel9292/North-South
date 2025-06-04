//import { CommissionsPaymentsService } from './../../commissions-payments/services/commissions-payments.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    /*
    @InjectRepository(CommissionsPaymentsService)
    private readonly commissionsPaymentsService: CommissionsPaymentsService,
*/
    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
    private readonly redisService: RedisModuleService,
  ) { }

  //metodo para calcular el valor de la comision de la poliza por cada registro o renovacion segun el periodo
  private calculateCommissionValue(paymentsToAdvisor: number, paymentFrequency: number): number {
    let commissionValue = parseFloat((paymentsToAdvisor / paymentFrequency).toFixed(2));
    return commissionValue
  }
  //1: metodo para registrar un pago de poliza

  public createPayment = async (body: PaymentDTO): Promise<PaymentEntity> => {
    try {
      // validar si la póliza existe antes de registrar el pago.
      const policy = await this.policyRepository.findOne({
        where: { id: body.policy_id },
        relations: ['payments', 'renewals']
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
      await this.redisService.del(`newPayment:${newPayment.id}`);
      await this.redisService.del('payments');
      await this.redisService.del('paymentsByStatus:general');
      // Usar directamente el policy_id del body
      await this.redisService.del(`policy:${body.policy_id}`);

      //OJO: SE ETRA CREANDO EL PRIMER PAGO DE COMOSION POR REGISTRO DE POLIZA
      const commission = this.calculateCommissionValue(policy.paymentsToAdvisor, policy.payment_frequency_id);
      // Crear el pago de comisión
      const commissionPayment = {
        value: commission,
        number_payment: 1,
        payment_frequency_id: policy.payment_frequency_id,
        policy_id: policy.id,
        status_payment_id: 1,
        createdAt: DateHelper.normalizeDateForDB(new Date()),
      };
      // Guardar el pago de comisión
      //await this.commissionsPaymentsService.createCommissionPayment(commissionPayment);
      return newPayment;

    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //2: metodo para consultar todos los pagos de las polizas
  public getAllPayments = async (): Promise<PaymentEntity[]> => {
    try {
      /*
      const cachedPayments = await this.redisService.get('payments');
      if (cachedPayments) {
        return JSON.parse(cachedPayments);
      }*/
      const payments: PaymentEntity[] = await this.paymentRepository.find({
        order: {
          id: 'DESC',
        },
        relations: [
          'policies',
          'paymentStatus',
          'policies.paymentFrequency',
          'policies.payments',
        ],
        select: {
          policies: {
            id: true,
            numberPolicy: true,
            //payment_frequency_id: true,
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
      //await this.redisService.set('payments', JSON.stringify(payments), 32400); // TTL de 1 hora
      return payments;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //3: metodo para obtener los pagos por id
  public getPaymentsId = async (id: number): Promise<PaymentEntity> => {
    try {

      //const cachedPaymentsId = await this.redisService.get('paymentId');
      /*
      const cachedPaymentsId = await this.redisService.get(`paymentId:${id}`);
      if (cachedPaymentsId) {
        return JSON.parse(cachedPaymentsId);
      }*/
      const paymentId: PaymentEntity = await this.paymentRepository.findOne({
        where: { id },
        relations: ['policies', 'paymentStatus'],
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
      /*
            await this.redisService.set(
              'paymentId',
              JSON.stringify(paymentId),
              32400,
            ); // TTL de 1 hora
      */
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
      ); // TTL de 1 hora
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
      //const cachedPayments = await this.redisService.get(cacheKey);

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
      ); // TTL de 9 horaL de 1 hora
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

      // Calcular el nuevo valor pendiente

      const newPendingValue = payment.pending_value;
      updateData.updatedAt = DateHelper.normalizeDateForComparison(new Date());

      if (newPendingValue < 0) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'El valor pendiente no puede ser negativo',
        });
      }
      Object.assign(payment, updateData);

      const paymentUpdated = await this.paymentRepository.save(payment);
      // Limpiar todas las claves de caché relevantes
      await this.redisService.del(`newPayment:${id}`);
      await this.redisService.del('payments');
      await this.redisService.del('paymentsByStatus:general');
      if (payment.policies?.id) {
        await this.redisService.del(`policy:${payment.policies.id}`);
      }
      if (payment.policies?.company?.id) {
        await this.redisService.del(`paymentsByStatus:${payment.policies.company.id}`);
      }
      // Si tu modelo de asesor usa cache por id:
      if (payment.policies?.advisor?.id) {
        await this.redisService.del(`advisor:${payment.policies.advisor.id}`);
      }

      return paymentUpdated;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  // 7: Nuevo método para obtener póliza con pagos actualizados
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
