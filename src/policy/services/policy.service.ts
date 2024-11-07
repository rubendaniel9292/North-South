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

@Injectable()
export class PolicyService extends ValidateEntity {
  constructor(
    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
    private readonly policyStatusService: PolicyStatusService, // Inyectar el servicio existente

    @InjectRepository(PolicyTypeEntity)
    private readonly policyTypeRepository: Repository<PolicyTypeEntity>,
    @InjectRepository(PaymentFrequencyEntity)
    private readonly policyFrecuencyRepository: Repository<PaymentFrequencyEntity>,
    @InjectRepository(PaymentMethodEntity)
    private readonly policyPaymentMethod: Repository<PaymentMethodEntity>,
    @InjectRepository(RenewalEntity)
    private readonly policyRenevalMethod: Repository<RenewalEntity>,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(policyRepository);
  }
  //1:metodo para registrar una poliza
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
      // Asignar el estado determinado al body de la tarjeta
      body.policy_status_id = determinedStatus.id;
      const newPolicy = await this.policyRepository.save(body);
      return newPolicy;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //2:metodo para consultas todas las polizas
  public getAllPolicies = async (): Promise<PolicyEntity[]> => {
    try {
      const policies: PolicyEntity[] = await this.policyRepository.find({
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
      return policies;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3:metodo para consultas todas las polizas en base al estado
  public getAllPoliciesStatus = async (): Promise<PolicyEntity[]> => {
    try {
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
          'creditCard',
          'creditCard.bank',
          'bankAccount',
          'bankAccount.bank',
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
      return policiesStatus;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //4: metodo para obtener el listado de los tipos de poliza
  public getTypesPolicies = async (): Promise<PolicyTypeEntity[]> => {
    try {
      const types: PolicyTypeEntity[] = await this.policyTypeRepository.find();
      if (!types) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      return types;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //5: metodo para obtener el listado de las frecuencias
  public getFrecuencyPolicies = async (): Promise<PaymentFrequencyEntity[]> => {
    try {
      const frecuency: PaymentFrequencyEntity[] =
        await this.policyFrecuencyRepository.find();
      if (!frecuency) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      return frecuency;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //6: metodo para obtener el listado de los  pagos
  public getPayment = async (): Promise<PaymentMethodEntity[]> => {
    try {
      const payment: PaymentMethodEntity[] =
        await this.policyPaymentMethod.find();

      if (!payment) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      return payment;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //7: metodo para obtener las polizas mediante su id
  public findPolicyById = async (id: number): Promise<PolicyEntity> => {
    try {
      const policyId = await this.policyRepository.findOne({
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
      return newReneval;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
