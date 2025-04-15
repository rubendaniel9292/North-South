import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { PaymentDTO } from '../dto/payment.dto';
import { PaymentEntity } from '../entity/payment.entity';
import { PaymentStatusEntity } from '../entity/payment.status.entity';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';

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
  //1: metodo para registrar un pago de poliza

  public createPayment = async (body: PaymentDTO): Promise<PaymentEntity> => {
    try {
      // validar si la póliza existe antes de registrar el pago.
      const policy = await this.policyRepository.findOne({
        where: { id: body.policy_id },
      });

      if (!policy) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      const newPayment = await this.paymentRepository.save(body);

      // Guardar en Redis
      //await this.redisService.set(`newPayment:${newPayment.id}`, JSON.stringify(newPayment), 32400); // TTL de 1 hora

      // Eliminar el caché de todos los pagos y pagos por compañía para evitar inconsistencias.

      //await this.redisService.del('payments');
      //await this.redisService.del('paymentsByStatus:general');
      /*
      if (policy.company?.id) {
        await this.redisService.del(`paymentsByStatus:${policy.company.id}`);
      }*/
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
      const payment = await this.paymentRepository.findOne({ where: { id } });
      if (!payment) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró el pago',
        });
      }

      // Calcular el nuevo valor pendiente

      const newPendingValue = payment.pending_value;
      const updatedAt = new Date(); // Fecha actual en UTC
      updatedAt.setHours(updatedAt.getHours() - 5); // Ajusta a UTC-5
      updateData.updatedAt = updatedAt;

      if (newPendingValue < 0) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'El valor pendiente no puede ser negativo',
        });
      }
      Object.assign(payment, updateData);

      const paymentUpdated = await this.paymentRepository.save(payment);
      // Limpiar todas las claves de caché relevantes
      /*
      await this.redisService.del(`newPayment:${id}`);
      await this.redisService.del('payments');
      await this.redisService.del('paymentsByStatus:general');
      await this.redisService.del(`policy:${payment.policies.id}`);
      */
      if (payment.policies?.company?.id) {
        await this.redisService.del(`paymentsByStatus:${payment.policies.company.id}`);
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
