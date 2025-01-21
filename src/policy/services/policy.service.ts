import { PolicyTypeEntity } from './../entities/policy_type.entity';
import { ValidateEntity } from '@/helpers/validations';
import { Injectable } from '@nestjs/common';
import { PolicyEntity } from '../entities/policy.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { PolicyDTO } from '../dto/policy.dto';
import { PolicyStatusService } from '@/helpers/policy.status';
import { PaymentFrequencyEntity } from '../entities/payment_frequency.entity';
import { PaymentMethodEntity } from '../entities/payment_method.entity';
import { RenewalEntity } from '../entities/renewal.entity';
import { PolicyRenewalDTO } from '../dto/policy.renewal.dto';
import { PaymentService } from '@/payment/services/payment.service'; // Asegúrate de importar el servicio de pagos
import { PaymentDTO } from '@/payment/dto/payment.dto';
import { PaymentEntity } from '@/payment/entity/payment.entity';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';

@Injectable()
export class PolicyService extends ValidateEntity {
  constructor(
    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
    private readonly policyStatusService: PolicyStatusService,

    @InjectRepository(PaymentEntity) // Inyectar el servicio existente
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly paymentService: PaymentService,

    @InjectRepository(PolicyTypeEntity)
    private readonly policyTypeRepository: Repository<PolicyTypeEntity>,
    @InjectRepository(PaymentFrequencyEntity)
    private readonly policyFrecuencyRepository: Repository<PaymentFrequencyEntity>,
    @InjectRepository(PaymentMethodEntity)
    private readonly policyPaymentMethod: Repository<PaymentMethodEntity>,
    @InjectRepository(RenewalEntity)
    private readonly policyRenevalMethod: Repository<RenewalEntity>,
    private readonly redisService: RedisModuleService,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(policyRepository);
  }
  //1:metodo para registrar una poliza
  private calculatePaymentValue(
    policyValue: number,
    paymentFrequency: number,
  ): number {
    let valueToPay = 0;

    switch (paymentFrequency) {
      case 1: // Pago mensual
        valueToPay = parseFloat((policyValue / 12).toFixed(2));
        break;
      case 2: // Pago trimestral
        valueToPay = parseFloat((policyValue / 4).toFixed(2));
        break;
      case 3: // Pago semestral
        valueToPay = parseFloat((policyValue / 2).toFixed(2));
        break;
      default: // Pago anual
        valueToPay = policyValue;
        break;
    }

    return valueToPay;
  }
  public createPolicy = async (body: PolicyDTO): Promise<PolicyEntity> => {
    try {
      // Primero validamos cédula y correo

      // Convertir el valor de personalData a booleano
      //body.personalData = body.personalData === 'true' || body.personalData === true;
      await this.validateInput(body, 'policy');
      const endDate = new Date(body.endDate);

      // Reutilizar el método determinePolicyStatus para obtener el estado correcto
      const determinedStatus =
        await this.policyStatusService.determinePolicyStatus(endDate);

      // Asignar el estado determinado al body
      body.policy_status_id = determinedStatus.id;
      const newPolicy = await this.policyRepository.save(body);

      // Calcular el valor del pago según la frecuencia de pago y crear un pago inicial
      const paymentFrequency = Number(newPolicy.payment_frequency_id);
      const valueToPay = this.calculatePaymentValue(
        newPolicy.policyValue,
        paymentFrequency,
      );
      console.log(paymentFrequency, valueToPay);
      const paymentData: PaymentDTO = {
        policy_id: newPolicy.id,
        number_payment: 1,
        value: valueToPay,
        pending_value: newPolicy.policyValue,
        status_payment_id: 1,
        credit: 0,
        balance: valueToPay,
        total: 0,
        observations: '',
        createdAt: newPolicy.startDate,
        updatedAt: new Date(),
      };
      await this.paymentService.createPayment(paymentData);
      // Guardar en Redis
      await this.redisService.set(`newPolicy:${newPolicy.id}`, JSON.stringify(newPolicy), 32400); // TTL de 1 hora
      /*
      Invalidar la caché es eliminar o marcar como obsoletos los datos almacenados en la caché 
      para asegurar que se obtengan datos actualizados.
       Mantiene la consistencia de los datos, evita datos obsoletos y mejora el rendimiento 
       general de la aplicación.
       Después de cualquier actualización en la base de datos o en eventos específicos 
       que afecten los datos en caché
      */
      await this.redisService.del('policies');
      console.log(newPolicy)
      return newPolicy;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //2:metodo para consultas todas las polizas
  public getAllPolicies = async (): Promise<PolicyEntity[]> => {
    try {
      const cachedPolicies = await this.redisService.get('policies');
      if (cachedPolicies) {
        return JSON.parse(cachedPolicies);
      }
      const policies: PolicyEntity[] = await this.policyRepository.find({
        relations: [
          'policyType',
          'policyStatus',
          'paymentFrequency',
          'company',
          'advisor',
          'customer',
          'payments',
          'payments.paymentStatus',
          'paymentMethod',
          'bankAccount',
          'bankAccount.bank',
          'creditCard',
          'creditCard.bank',
          'renewals',
        ],
        select: {
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
          observations: true,
          renewalCommission: true,
          policyType: {
            policyName: true,
          },
          customer: {
            ci_ruc: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },
          company: {
            companyName: true,
          },
          advisor: {
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },
          paymentMethod: {
            methodName: true,
          },
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
      });
      if (!policies || policies.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      await this.redisService.set('policies', JSON.stringify(policies), 32400); // TTL de 1 hora
      console.log(policies)
      return policies;
     
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //3:metodo para consultas todas las polizas en base al estado
  public getAllPoliciesStatus = async (): Promise<PolicyEntity[]> => {
    try {
      const cachedPolicies = await this.redisService.get('policiesStatus');
      if (cachedPolicies) {
        return JSON.parse(cachedPolicies);
      }
      const policiesStatus: PolicyEntity[] = await this.policyRepository.find({
        where: [
          { policy_status_id: 3 }, // Estado: por vencer
          { policy_status_id: 4 }, // Estado: vencida
        ],
        relations: [
          'policyType',
          'policyStatus',
          'paymentFrequency',
          'company',
          'advisor',
          'customer',
          'paymentMethod',
          'bankAccount',
          'bankAccount.bank',
          'creditCard',
          'creditCard.bank',
          'payments',
          'payments.paymentStatus',
          'renewals',
        ],
        select: {
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
          observations: true,
          renewalCommission: true,
          policyType: {
            policyName: true,
          },

          customer: {
            ci_ruc: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },
          paymentFrequency: {
            id: true,
            frequencyName: true,
          },
          company: {
            companyName: true,
          },
          advisor: {
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },

          paymentMethod: {
            methodName: true,
          },
          creditCard: {
            bank_id: true,
            bank: {
              bankName: true,
            },
          },
          bankAccount: {
            bank_id: true,
            bank: {
              bankName: true,
            },
          },
        },
      });
      if (!policiesStatus || policiesStatus.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      await this.redisService.set('policiesStatus', JSON.stringify(policiesStatus), 32400); // TTL de 1 hora
      return policiesStatus;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //4: metodo para obtener el listado de los tipos de poliza
  public getTypesPolicies = async (): Promise<PolicyTypeEntity[]> => {
    try {
      const cachedTypes = await this.redisService.get('types');
      if (cachedTypes) {
        return JSON.parse(cachedTypes);
      }
      const types: PolicyTypeEntity[] = await this.policyTypeRepository.find();
      if (!types) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      await this.redisService.set('types', JSON.stringify(types), 32400); // TTL de 1 hora
      return types;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //5: metodo para obtener el listado de las frecuencias
  public getFrecuencyPolicies = async (): Promise<PaymentFrequencyEntity[]> => {
    try {
      const cachedFrequency = await this.redisService.get('frecuency');
      if (cachedFrequency) {
        return JSON.parse(cachedFrequency);
      }
      const frecuency: PaymentFrequencyEntity[] =
        await this.policyFrecuencyRepository.find();
      if (!frecuency) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      await this.redisService.set('frecuency', JSON.stringify(frecuency), 32400); // TTL de 1 hora
      return frecuency;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //6: metodo para obtener el listado de los meto  pagos
  public getPaymentMethod = async (): Promise<PaymentMethodEntity[]> => {
    try {
      const cachedPayments = await this.redisService.get('payment');
      if (cachedPayments) {
        return JSON.parse(cachedPayments);
      }
      const payment: PaymentMethodEntity[] =
        await this.policyPaymentMethod.find();

      if (!payment) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      await this.redisService.set('payment', JSON.stringify(payment), 32400); // TTL de 1 hora
      return payment;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //7: metodo para obtener las polizas mediante su id
  public findPolicyById = async (id: number): Promise<PolicyEntity> => {
    try {

      const policyId: PolicyEntity = await this.policyRepository.findOne({
        where: { id },
        relations: [
          'policyType',
          'policyStatus',
          'paymentFrequency',
          'company',
          'advisor',
          'customer',
          'paymentMethod',
          'bankAccount',
          'bankAccount.bank',
          'creditCard',
          'creditCard.bank',
          'payments',
          'payments.paymentStatus',
          'renewals',
        ],
        select: {
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
          policyType: {
            policyName: true,
          },
          customer: {
            ci_ruc: true,
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
          paymentMethod: {
            methodName: true,
          },
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
      });

      if (!policyId) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      return policyId;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //8: metodo para registrar una renovacion de poliza
  public createReneval = async (
    body: PolicyRenewalDTO,
  ): Promise<RenewalEntity> => {
    try {
      // validar si la póliza existe antes de registrar la renovacion
      const policy = await this.policyRepository.findOne({
        where: { id: body.policy_id },
      });

      if (!policy) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      const newReneval = await this.policyRenevalMethod.save(body);
      // Guardar en Redis
      await this.redisService.set(`newReneval:${newReneval.id}`, JSON.stringify(newReneval), 32400);
      return newReneval;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
