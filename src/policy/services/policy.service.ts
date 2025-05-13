import { PolicyTypeEntity } from './../entities/policy_type.entity';
import { ValidateEntity } from '@/helpers/validations';
import { Injectable } from '@nestjs/common';
import { PolicyEntity } from '../entities/policy.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { PolicyDTO } from '../dto/policy.dto';
import { PolicyStatusService } from '@/helpers/policy.status';
import { PaymentFrequencyEntity } from '../entities/payment_frequency.entity';
import { PaymentMethodEntity } from '../entities/payment_method.entity';
import { RenewalEntity } from '../entities/renewal.entity';
import { PolicyRenewalDTO } from '../dto/policy.renewal.dto';
import { PaymentService } from '@/payment/services/payment.service'; // Asegúrate de importar el servicio de pagos
import { PaymentDTO } from '@/payment/dto/payment.dto';
//import { PaymentEntity } from '@/payment/entity/payment.entity';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CacheKeys } from '@/constants/cache.enum';
import { PolicyStatusEntity } from '../entities/policy_status.entity';
import { DateHelper } from '@/helpers/date.helper';
@Injectable()
export class PolicyService extends ValidateEntity {
  constructor(
    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
    private readonly policyStatusService: PolicyStatusService,
    //@InjectRepository(PaymentEntity) // Inyectar el servicio existente
    //private readonly paymentRepository: Repository<PaymentEntity>,
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

    @InjectRepository(PolicyStatusEntity)
    private readonly policyStatusRepository: Repository<PolicyStatusEntity>,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(policyRepository);
  }
  private calculatePaymentValue(
    policyValue: number,
    paymentFrequency: number,
    numberOfPayments?: number,
  ): number {
    let valueToPay = 0;
    console.log('numero de pagos ', numberOfPayments);
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
      case 5: // otro pago
        if (numberOfPayments) {
          valueToPay = parseFloat((policyValue / numberOfPayments).toFixed(2));
        } else {
          throw new Error(
            'Number of payments is required for payment frequency 5',
          );
        }
        break;
      default: // Pago anual
        valueToPay = policyValue;
        break;
    }

    return valueToPay;
  }
  // Generar pagos utilizando el servicio de pagos
  private async generatePaymentsUsingService(policy: PolicyEntity, startDate: Date, today: Date, paymentFrequency: number): Promise<void> {
    const policyValue = Number(policy.policyValue);
    const valueToPay = this.calculatePaymentValue(policyValue, paymentFrequency, policy.numberOfPayments);

    let totalPayments = 0;
    switch (paymentFrequency) {
      case 1: // Mensual
        totalPayments = Math.floor((today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth()));
        break;
      case 2: // Trimestral
        totalPayments = Math.floor((today.getFullYear() - startDate.getFullYear()) * 4 + (today.getMonth() - startDate.getMonth()) / 3);
        break;
      case 3: // Semestral
        totalPayments = Math.floor((today.getFullYear() - startDate.getFullYear()) * 2 + (today.getMonth() - startDate.getMonth()) / 6);
        break;
      case 4: // Anual
        totalPayments = Math.floor(today.getFullYear() - startDate.getFullYear());
        break;
      case 5: // Personalizado
        const numberOfPayments = policy.numberOfPayments || 0;
        totalPayments = Math.floor((today.getTime() - startDate.getTime()) / ((policy.endDate.getTime() - startDate.getTime()) / numberOfPayments));
        break;
      default:
        throw new Error('Frecuencia de pago no válida');
    }

    let currentDate = new Date(startDate);
    let paymentNumber = 1;
    let accumulated = 0;

    if (totalPayments === 0) {
      // Crear un pago por defecto si no hay pagos atrasados
      const paymentData: PaymentDTO = {
        policy_id: policy.id,
        number_payment: paymentNumber,
        value: valueToPay,
        pending_value: policyValue - valueToPay,
        status_payment_id: 1, // 1: Pendiente
        credit: 0,
        balance: valueToPay,
        total: 0,
        observations: '',
        createdAt: policy.startDate
      };

      await this.paymentService.createPayment(paymentData);
    } else {
      // Generar pagos atrasados
      while (currentDate <= today) {
        accumulated += valueToPay;
        let pendingValue = policyValue - accumulated;
        if (pendingValue < 0) {
          pendingValue = 0;
        }

        const paymentData: PaymentDTO = {
          policy_id: policy.id,
          number_payment: paymentNumber,
          value: valueToPay,
          pending_value: pendingValue,
          status_payment_id: 1,
          credit: 0,
          balance: valueToPay,
          total: 0,
          observations: '',
          //createdAt: new Date(currentDate),
          createdAt: paymentNumber === 1 ? policy.startDate : DateHelper.normalizeDateForDB(new Date(currentDate))
        };

        // Llamar al servicio de pagos para registrar el pago
        await this.paymentService.createPayment(paymentData);

        // Avanzar la fecha según la frecuencia de pago
        switch (paymentFrequency) {
          case 1: // Mensual
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 2: // Trimestral
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
          case 3: // Semestral
            currentDate.setMonth(currentDate.getMonth() + 6);
            break;
          case 4: // Anual
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          case 5: // Personalizado
            const daysBetween = Math.floor((policy.endDate.getTime() - startDate.getTime()) / totalPayments);
            currentDate.setDate(currentDate.getDate() + daysBetween);
            break;
        }

        paymentNumber++;
      }
    }
  }

  // Validar el valor de la póliza
  private validatePolicyValue(policyValue: number | null): void {
    if (policyValue == null) {
      throw new Error('El valor de la póliza no puede ser nulo');
    }
    if (isNaN(Number(policyValue))) {
      throw new Error('El valor de la póliza no es un número válido');
    }
  }

  // Manejar renovaciones automáticas
  private async handleRenewals(policy: PolicyEntity, startDate: Date, today: Date): Promise<void> {
    const yearsDifference = today.getFullYear() - startDate.getFullYear();
    if (yearsDifference > 0) {
      for (let i = 1; i <= yearsDifference; i++) {
        const renewalDate = new Date(startDate);
        renewalDate.setFullYear(startDate.getFullYear() + i);
        // Normalizar la fecha de renovación
        const normalizedRenewalDate = DateHelper.normalizeDateForDB(renewalDate);

        const renewalData: PolicyRenewalDTO = {
          policy_id: policy.id,
          renewalNumber: i,
          observations: `Renovación automática año/periodo ${i}`,
          createdAt: normalizedRenewalDate,
        };

        await this.createRenevalAndUpdate(renewalData);
      }
    }
  }

  // Invalidar cachés relacionados con pólizas
  private async invalidateCaches(): Promise<void> {
    await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES);
    await this.redisService.del('policies');
    await this.redisService.del('policiesStatus');
    await this.redisService.del('customers');
    await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES_BY_STATUS);

  }

  //1:metodo para registrar una poliza
  /*
  public createPolicy = async (body: PolicyDTO): Promise<PolicyEntity> => {
    try {
      await this.validateInput(body, 'policy');
      const endDate = new Date(body.endDate);

      // Determinar el estado inicial de la póliza
      const determinedStatus =
        await this.policyStatusService.determineNewPolicyStatus(endDate);
      body.policy_status_id = determinedStatus.id;

      // Crear la póliza en la base de datos
      const newPolicy = await this.policyRepository.save(body);

      if (newPolicy.policyValue == null) {
        throw new Error('El valor de la póliza no puede ser nulo');
      }

      const policyValue = Number(newPolicy.policyValue);
      if (isNaN(policyValue)) {
        throw new Error('El valor de la póliza no es un número válido');
      }

      // Obtener la frecuencia de pago y el número de pagos (si es personalizado)
      const paymentFrequency = Number(newPolicy.payment_frequency_id);
      const numberOfPayments =
        paymentFrequency === 5 ? Number(body?.numberOfPayments) : undefined;

      // Calcular el valor de cada pago
      const valueToPay = this.calculatePaymentValue(
        policyValue,
        paymentFrequency,
        numberOfPayments,
      );

      if (isNaN(valueToPay)) {
        throw new Error('Valor calculado de pago inválido');
      }

      // Obtener la fecha de inicio de la póliza
      const startDate = new Date(newPolicy.startDate);
      const today = new Date();

      // Calcular el número de pagos atrasados
      let totalPayments = 0;
      switch (paymentFrequency) {
        case 1: // Mensual
          totalPayments = Math.floor(
            (today.getFullYear() - startDate.getFullYear()) * 12 +
            (today.getMonth() - startDate.getMonth()),
          );
          break;
        case 2: // Trimestral
          totalPayments = Math.floor(
            (today.getFullYear() - startDate.getFullYear()) * 4 +
            (today.getMonth() - startDate.getMonth()) / 3,
          );
          break;
        case 3: // Semestral
          totalPayments = Math.floor(
            (today.getFullYear() - startDate.getFullYear()) * 2 +
            (today.getMonth() - startDate.getMonth()) / 6,
          );
          break;
        case 4: // Anual
          totalPayments = Math.floor(
            today.getFullYear() - startDate.getFullYear(),
          );
          break;
        case 5: // Personalizado
          if (!numberOfPayments || numberOfPayments <= 0) {
            throw new Error(
              'Número de pagos inválido para frecuencia personalizada',
            );
          }
          totalPayments = Math.floor(
            (today.getTime() - startDate.getTime()) /
            ((endDate.getTime() - startDate.getTime()) / numberOfPayments),
          );
          break;
        default:
          throw new Error('Frecuencia de pago no válida');
      }

      // Asegurar que el número de pagos no exceda el total permitido
      if (paymentFrequency !== 5 && totalPayments > policyValue / valueToPay) {
        totalPayments = Math.floor(policyValue / valueToPay);
      }

      // Generar pagos atrasados (si los hay) y al menos un pago por defecto
      let currentDate = new Date(startDate);
      let paymentNumber = 1;
      let accumulated = 0;
      const yearsDifference = today.getFullYear() - currentDate.getFullYear();
      // Crear renovaciones automáticas basadas en los años transcurridos
      if (yearsDifference > 0) {
        console.log(`La póliza tiene ${yearsDifference} años de antigüedad, creando renovaciones automáticas...`);

        // Crear renovaciones para cada año anterior
        for (let i = 1; i <= yearsDifference; i++) {
          const renewalDate = new Date(startDate);
          renewalDate.setFullYear(startDate.getFullYear() + i);

          const renewalData: PolicyRenewalDTO = {
            policy_id: newPolicy.id,
            renewalNumber: i,
            observations: `Renovación automática año/periodo ${i}`,
            createdAt: renewalDate,
          };

          await this.createRenevalAndUpdate(renewalData);
          console.log(`Renovación automática ${i} creada para la fecha: ${renewalDate.toISOString()}`);
        }
      }

      if (totalPayments === 0) {
        // Crear un pago por defecto si no hay pagos atrasados
        const paymentData: PaymentDTO = {
          policy_id: newPolicy.id,
          number_payment: paymentNumber,
          value: valueToPay,
          pending_value: policyValue - valueToPay,
          status_payment_id: 1, // 1: Pendiente
          credit: 0,
          balance: valueToPay,
          total: 0,
          observations: '',
          createdAt: currentDate,
        };

        await this.paymentService.createPayment(paymentData);
      } else {
        // Generar pagos atrasados

        while (currentDate <= today) {
          accumulated += valueToPay;
          let pendingValue = policyValue - accumulated;
          if (pendingValue < 0) {
            pendingValue = 0;
            //console.log('El valor pendiente no puede ser negativo. No se crearán más pagos.');
            //break;
          }
          //pendingValue = parseFloat(pendingValue.toFixed(2));
          const paymentData: PaymentDTO = {
            policy_id: newPolicy.id,
            number_payment: paymentNumber,
            value: valueToPay,
            pending_value: pendingValue,
            status_payment_id: 1,
            credit: 0,
            balance: valueToPay,
            total: 0,
            observations: '',
            createdAt: new Date(currentDate),
          };

          await this.paymentService.createPayment(paymentData);
          // Verificar si el período actual está completamente pagado
          if (pendingValue === 0) {
            console.log(
              `El período actual finalizó con número de pago: ${paymentNumber}`,
            );
            // Reiniciar acumulados para el siguiente año o período
            accumulated = 0;
          }

          // Avanzar la fecha según la frecuencia de pago
          switch (paymentFrequency) {
            case 1: // Mensual
              currentDate.setMonth(currentDate.getMonth() + 1);
              break;
            case 2: // Trimestral
              currentDate.setMonth(currentDate.getMonth() + 3);
              break;
            case 3: // Semestral
              currentDate.setMonth(currentDate.getMonth() + 6);
              break;
            case 4: // Anual
              currentDate.setFullYear(currentDate.getFullYear() + 1);
              break;
            case 5: // Personalizado
              const daysBetween = Math.floor(
                (endDate.getTime() - startDate.getTime()) / numberOfPayments,
              );
              currentDate.setDate(currentDate.getDate() + daysBetween);
              break;
          }

          paymentNumber++;
        }
      }
      // Invalidar todas las cachés relacionadas con pólizas
      await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES);
      await this.redisService.del('policies');
      await this.redisService.del('policiesStatus');
      await this.redisService.del('customers');
      return newPolicy;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };*/
  public createPolicy = async (body: PolicyDTO): Promise<PolicyEntity> => {
    try {
      // Validar los datos de entrada
      await this.validateInput(body, 'policy');
      const endDate = DateHelper.normalizeDateForDB(body.endDate);
      const startDate = DateHelper.normalizeDateForDB(body.startDate);
      body.startDate = startDate;
      body.endDate = endDate;

      // Determinar el estado inicial de la póliza
      const determinedStatus = await this.policyStatusService.determineNewPolicyStatus(endDate);
      body.policy_status_id = determinedStatus.id;


      // Crear la póliza en la base de datos
      const newPolicy = await this.policyRepository.save(body);

      // Validar el valor de la póliza
      this.validatePolicyValue(Number(newPolicy.policyValue));

      // Calcular pagos y renovaciones
      const paymentFrequency = Number(newPolicy.payment_frequency_id);

      const today = new Date();


      // Crear renovaciones automáticas
      await this.handleRenewals(newPolicy, startDate, today);

      // Generar pagos utilizando el servicio de pagos
      await this.generatePaymentsUsingService(newPolicy, startDate, today, paymentFrequency);

      // Invalidar cachés
      await this.invalidateCaches();

      return newPolicy;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //2:metodo para consultas todas las polizas
  public getAllPolicies = async (search?: string): Promise<PolicyEntity[]> => {
    try {

      // Solo usar caché si no hay búsqueda específica
      if (!search) {
        const cachedPolicies = await this.redisService.get(
          CacheKeys.GLOBAL_ALL_POLICIES,
        );
        if (cachedPolicies) {
          return JSON.parse(cachedPolicies);
        }
      }
      // Crea un array de condiciones de búsqueda en este caso por nu  mero de poliza
      const whereConditions: any[] = [];

      if (search) {
        const searchCondition = Like(`%${search}%`);
        whereConditions.push({ numberPolicy: searchCondition });
      }
      const policies: PolicyEntity[] = await this.policyRepository.find({
        order: {
          id: 'DESC',
        },
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
          company: {
            id: true,
            companyName: true,
          },
          advisor: {
            id: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },

          customer: {
            id: true,
            ci_ruc: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
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
          payments: {
            id: true,
            number_payment: true,
            value: true,
            pending_value: true,
            status_payment_id: true,
            credit: true,
            balance: true,
            total: true,
            observations: true,
            createdAt: true,
            paymentStatus: {
              statusNamePayment: true,
            },
          }

        },
      });
      if (!policies || policies.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      //await this.redisService.set(CacheKeys.GLOBAL_ALL_POLICIES, 32400); // TTL de 1 hora
      console.log(policies)
      return policies;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //3:metodo para consultas todas las polizas en base al estado
  public getAllPoliciesStatus = async (): Promise<PolicyEntity[]> => {
    try {
      const cachedPolicies = await this.redisService.get(
        CacheKeys.GLOBAL_ALL_POLICIES_BY_STATUS,
      );
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

      await this.redisService.set(
        CacheKeys.GLOBAL_ALL_POLICIES_BY_STATUS,
        JSON.stringify(policiesStatus),
        32400,
      );
      return policiesStatus;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //4: metodo para obtener el listado de los tipos de poliza
  public getTypesPolicies = async (): Promise<PolicyTypeEntity[]> => {
    try {
      //const cachedTypes = await this.redisService.get('types');
      const cachedTypes = await this.redisService.get(
        CacheKeys.GLOBAL_POLICY_TYPE,
      );
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
      //const cachedFrequency = await this.redisService.get('frecuency');
      const cachedFrequency = await this.redisService.get(
        CacheKeys.GLOBAL_PAYMENT_FREQUENCY,
      );
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
      await this.redisService.set(
        CacheKeys.GLOBAL_PAYMENT_FREQUENCY,
        JSON.stringify(frecuency),
        32400,
      ); // TTL de 1 hora
      return frecuency;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //6: metodo para obtener el listado de los metodos  pagos
  public getPaymentMethod = async (): Promise<PaymentMethodEntity[]> => {
    try {
      const cachedPayments = await this.redisService.get(
        CacheKeys.GLOBAL_PAYMENT_METHOD,
      );
      if (cachedPayments) {
        return JSON.parse(cachedPayments);
      }
      const allPaymentMethod: PaymentMethodEntity[] =
        await this.policyPaymentMethod.find();

      if (!allPaymentMethod) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      //await this.redisService.set('allPaymentMethod', JSON.stringify(allPaymentMethod), 32400); // TTL de 1 hora
      await this.redisService.set(
        CacheKeys.GLOBAL_PAYMENT_METHOD,
        JSON.stringify(allPaymentMethod),
        32400,
      ); // TTL de 1 hora

      return allPaymentMethod;
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
          customer: {
            id: true,
            ci_ruc: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },

          advisor: {
            id: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },
          company: {
            id: true,
            companyName: true,
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
        order: {
          payments: {
            id: 'DESC',
          },
          renewals: {
            id: 'DESC',
          }
        },
      });
      //console.log("POLIZA OBTENIDA DESDE EL SERVICIO DE POLIZA: ", policyId);
      if (!policyId || policyId === undefined) {
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


  //8: metodo para obetener los estados de las polizas
  public getPolicyStatus = async (): Promise<PolicyStatusEntity[]> => {
    try {
      const cachedPoliciesStatus = await this.redisService.get(
        CacheKeys.GLOBAL_POLICY_STATUS,
      );
      if (cachedPoliciesStatus) {
        return JSON.parse(cachedPoliciesStatus);
      }
      const allStatusPolicies: PolicyStatusEntity[] =
        await this.policyStatusRepository.find();
      if (!allStatusPolicies || allStatusPolicies.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      await this.redisService.set(
        CacheKeys.GLOBAL_POLICY_STATUS,
        JSON.stringify(allStatusPolicies),
      ); // TTL de 1 hora
      return allStatusPolicies;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //9: metodo para actualizar las polizas
  public updatedPolicy = async (
    id: number,
    updateData: Partial<PolicyEntity>,
  ): Promise<PolicyEntity> => {
    try {

      const policy: PolicyEntity = await this.policyRepository.findOne({
        where: { id },
      });
      //const endDate = new Date(updateData.endDate);
      const endDate = DateHelper.normalizeDateForDB(updateData.endDate);
      const startDate = DateHelper.normalizeDateForDB(updateData.startDate);
      updateData.startDate = startDate;
      updateData.endDate = endDate;

      // Determinar el estado inicial de la póliza
      const determinedStatus =
        await this.policyStatusService.determineNewPolicyStatus(endDate);
      updateData.policy_status_id = determinedStatus.id;
      if (!policy) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      // Validar y asignar solo las propiedades permitidas de updateData
      Object.assign(policy, updateData);

      // Guardar la política actualizada en la base de datos
      const policyUpdate: PolicyEntity =
        await this.policyRepository.save(policy);

      // Limpiar todas las claves de caché relevantes
      await this.redisService.del(`policy:${id}`);
      await this.redisService.del('policies');

      // Actualizar caché con los datos más recientes
      await this.redisService.set(
        `policy:${id}`,
        JSON.stringify(policyUpdate),
        32400, // Tiempo de expiración en segundos (9 horas)
      );

      return policyUpdate;
    } catch (error) {
      // Manejar errores y lanzar una excepción personalizada
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //10: metodo para registrar una renovacion de poliza
  public createRenevalAndUpdate = async (
    body: PolicyRenewalDTO,
  ): Promise<RenewalEntity> => {
    try {
      // validar si la póliza existe antes de registrar la renovacion
      // Obtener la póliza completa
      const policy = await this.findPolicyById(body.policy_id);

      if (!policy) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      const createdAt = DateHelper.normalizeDateForDB(body.createdAt);
      body.createdAt = createdAt;

      const newRenewal = await this.policyRenevalMethod.save(body);
      /*
            await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES);
            await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES_BY_STATUS);
            await this.redisService.del('policies');
            await this.redisService.del('policiesStatus');
            await this.redisService.del('customers');
      */
      // Invalidar cachés
      await this.invalidateCaches();
      // Crear automáticamente el primer pago para el nuevo período
      await this.createFirstPaymentAfterRenewal(policy, newRenewal);
      return newRenewal;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //11: Método para crear el primer pago después de una renovación
  private createFirstPaymentAfterRenewal = async (
    policy: PolicyEntity,
    newRenewal: RenewalEntity,
  ): Promise<void> => {
    try {

      // Calcular el valor del pago según la frecuencia de pago
      const paymentValue = this.calculatePaymentValue(
        Number(policy.policyValue),
        Number(policy.payment_frequency_id),

      );
      const nextNumberPayment = policy.payments.length + 1;
      // Calcular el saldo pendiente (valor total de la póliza menos el primer pago)
      const pendingValue = Number(policy.policyValue) - paymentValue;
      // Crear el objeto de pago
      const newPayment: PaymentDTO = {
        policy_id: policy.id,
        number_payment: nextNumberPayment, // Es el primer pago del nuevo período
        value: paymentValue,
        pending_value: Number(pendingValue.toFixed(2)),
        credit: 0,
        balance: paymentValue,
        total: 0,
        status_payment_id: 1, // Pendiente
        observations: `Primer pago generado automáticamente después de renovación #${newRenewal.renewalNumber}`,
        createdAt: DateHelper.normalizeDateForComparison(newRenewal.createdAt), // Usar la misma fecha de la renovación
      };
      // Guardar el nuevo pago
      await this.paymentService.createPayment(newPayment);
      console.log(`Primer pago creado automáticamente para la póliza ${policy.id} después de la renovación #${newRenewal.renewalNumber}`);
    } catch (error) {
      console.error('Error al crear el primer pago después de la renovación:', error);
      throw error;
    }
  };
}
