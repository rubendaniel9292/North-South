import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { PaymentDTO } from '../dto/payment.dto';
import { PaymentEntity } from '../entity/payment.entity';
import { PaymentStatusEntity } from '../entity/payment.status.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,

    @InjectRepository(PaymentStatusEntity)
    private readonly paymentStatusRepository: Repository<PaymentStatusEntity>,

    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
  ) {}
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
      return newPayment;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //2: metodo para consultar todos los pagos de las polizas
  public getAllPayments = async (): Promise<PaymentEntity[]> => {
    try {
      const payments: PaymentEntity[] = await this.paymentRepository.find({
        relations: ['policies', 'paymentStatus'],
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
      return payments;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //3: metodo para obtener los pagos por id
  public getPaymentsId = async (id: number): Promise<PaymentEntity> => {
    try {
      const paymentId = await this.paymentRepository.findOne({
        where: { id },
        relations: ['policies', 'paymentStatus'],
        select: {
          policies: {
            id: true,
            numberPolicy: true,
          },
        },
      });

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
      const paymentStatus = await this.paymentStatusRepository.find();

      if (!paymentStatus) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      return paymentStatus;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
