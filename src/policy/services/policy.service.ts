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
  //función para obtener pagos por ciclo según frecuencia
  private getPaymentsPerCycle(paymentFrequency: number, numberOfPayments?: number): number {
    let paymentsPerCycle = 1; // Por defecto

    switch (paymentFrequency) {
      case 1: // Mensual
        paymentsPerCycle = 12;
        break;
      case 2: // Trimestral
        paymentsPerCycle = 4;
        break;
      case 3: // Semestral
        paymentsPerCycle = 2;
        break;
      case 4: // Anual
        paymentsPerCycle = 1;
        break;
      case 5: // Personalizado
        paymentsPerCycle = numberOfPayments || 1;
        break;
    }

    return paymentsPerCycle;
  }
  // función para avanzar la fecha según la frecuencia de pago
  private advanceDate(currentDate: Date, paymentFrequency: number, policy?: PolicyEntity, startDate?: Date, paymentsPerCycle?: number): Date {
    const newDate = new Date(currentDate);

    switch (paymentFrequency) {
      case 1: // Mensual
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 2: // Trimestral
        newDate.setMonth(newDate.getMonth() + 3);
        break;
      case 3: // Semestral
        newDate.setMonth(newDate.getMonth() + 6);
        break;
      case 4: // Anual
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
      case 5: // Personalizado
        if (policy && startDate && paymentsPerCycle) {
          const daysBetween = Math.floor((policy.endDate.getTime() - startDate.getTime()) / paymentsPerCycle);
          newDate.setDate(newDate.getDate() + daysBetween);
        }
        break;
    }

    return newDate;
  }
  //funcion para calcular el valor de cada pago según la frecuencia de pagos segun el número de pagos en el ciclo
  private calculatePaymentValue(
    policyValue: number,
    paymentFrequency: number,
    numberOfPayments?: number,
  ): number {
    // Obtener el número de pagos por ciclo según la frecuencia
    const paymentsPerCycle = this.getPaymentsPerCycle(paymentFrequency, numberOfPayments);

    // Calcular el valor de cada pago
    let valueToPay = 0;

    if (paymentFrequency === 5) { // Caso especial para pagos personalizados
      if (numberOfPayments) {
        valueToPay = parseFloat((policyValue / numberOfPayments).toFixed(2));
      } else {
        throw new Error(
          'Number of payments is required for payment frequency 5',
        );
      }
    } else if (paymentsPerCycle > 0) {
      valueToPay = parseFloat((policyValue / paymentsPerCycle).toFixed(2));
    } else {
      valueToPay = policyValue; // Valor por defecto (pago anual)
    }

    return valueToPay;
  }

  // Generar pagos utilizando el servicio de pagos
  private async generatePaymentsUsingService(policy: PolicyEntity, startDate: Date, today: Date, paymentFrequency: number): Promise<void> {
    try {

      console.log(`Generando pagos iniciales para póliza ${policy.id} desde ${startDate.toISOString()} hasta la primera renovación`);
      const policyValue = Number(policy.policyValue);
      const valueToPay = this.calculatePaymentValue(policyValue, paymentFrequency, policy.numberOfPayments);

      // Calcular la fecha de la primera renovación
      const firstRenewalDate = new Date(startDate);
      firstRenewalDate.setFullYear(startDate.getFullYear() + 1);

      // Si la fecha de renovación es mayor que hoy, usar hoy como límite
      const endDate = firstRenewalDate <= today ? firstRenewalDate : today;

      // Obtener la póliza actualizada con todos sus pagos
      const updatedPolicy = await this.findPolicyById(policy.id);
      const existingPayments = updatedPolicy.payments || [];

      // Verificar si ya existen pagos para esta póliza
      if (existingPayments.length > 0) {
        console.log(`La póliza ${policy.id} ya tiene ${existingPayments.length} pagos. No se generarán pagos iniciales.`);
        return;
      }
      // Calcular cuántos pagos se deben generar según la frecuencia hasta la primera renovación
      const paymentsPerCycle = this.getPaymentsPerCycle(paymentFrequency, policy.numberOfPayments);

      // Generar los pagos del ciclo inicial
      let currentDate = new Date(startDate);
      let paymentNumber = 1;

      // Crear un conjunto para rastrear fechas ya procesadas
      const processedDates = new Set<string>();

      for (let i = 0; i < paymentsPerCycle && currentDate < endDate; i++) {
        // Normalizar la fecha para comparación
        const normalizedDate = DateHelper.normalizeDateForComparison(currentDate);
        const dateKey = normalizedDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        // Si no hemos procesado esta fecha antes
        if (!processedDates.has(dateKey)) {
          processedDates.add(dateKey);

          // Calcular el valor pendiente
          const pendingValue = i === paymentsPerCycle - 1 ? 0 : policyValue - (valueToPay * (i + 1));

          const paymentData: PaymentDTO = {
            policy_id: policy.id,
            number_payment: paymentNumber,
            value: valueToPay,
            pending_value: pendingValue,
            status_payment_id: 1, // 1: Pendiente
            credit: 0,
            balance: valueToPay,
            total: 0,
            observations: i === 0 ? 'Pago inicial de la póliza' : `Pago N° ${paymentNumber} del ciclo inicial`,
            createdAt: i === 0 ? policy.startDate : DateHelper.normalizeDateForComparison(new Date(currentDate))
          };

          console.log(`Creando pago inicial #${paymentNumber} para fecha ${currentDate.toISOString()} con valor pendiente ${pendingValue}`);
          await this.paymentService.createPayment(paymentData);
          paymentNumber++;
        }
        // Avanzar la fecha según la frecuencia de pago
        currentDate = this.advanceDate(currentDate, paymentFrequency, policy, startDate, paymentsPerCycle);
      }

      console.log(`Se crearon ${paymentNumber - 1} pagos iniciales para la póliza ${policy.id}`);
    } catch (error) {
      console.error(`Error al generar pagos iniciales: ${error.message}`);
      throw ErrorManager.createSignatureError(`Error al generar pagos iniciales: ${error.message}`);
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
        //const renewalDate = new Date(startDate);
        const renewalDate = new Date(startDate);
        renewalDate.setFullYear(startDate.getFullYear() + i);

        // Solo crear renovaciones hasta la fecha actual
        if (renewalDate <= today) {
          // Normalizar la fecha de renovación
          const normalizedRenewalDate = DateHelper.normalizeDateForComparison(renewalDate);

          // Crear la renovación
          const renewalData: PolicyRenewalDTO = {
            policy_id: policy.id,
            renewalNumber: i,
            observations: `Renovación automática año/periodo N° ${i}`,
            createdAt: normalizedRenewalDate,
          };

          // Crear la renovación y generar solo los pagos necesarios según la frecuencia
          await this.createRenewalWithPayments(renewalData, policy, normalizedRenewalDate);
        }
      }
    }
  }

  // Método para crear una renovación y sus pagos correspondientes
  private async createRenewalWithPayments(renewalData: PolicyRenewalDTO, policy: PolicyEntity, renewalDate: Date): Promise<void> {
    try {
      // 1. Crear la renovación
      const renewal = await this.policyRenevalMethod.save(renewalData);

      // 2. Obtener la póliza actualizada con todos sus pagos
      const updatedPolicy = await this.findPolicyById(policy.id);
      const existingPayments = updatedPolicy.payments || [];

      // 3. Encontrar el número más alto de pago existente
      const maxPaymentNumber = existingPayments.length > 0
        ? Math.max(...existingPayments.map(p => p.number_payment))
        : 0;

      // 4. Calcular cuántos pagos se deben generar según la frecuencia
      const paymentFrequency = Number(policy.payment_frequency_id);

      const paymentsPerCycle = this.getPaymentsPerCycle(paymentFrequency, policy.numberOfPayments);

      // 5. Generar solo los pagos necesarios para este ciclo (hasta la fecha actual)
      const policyValue = Number(policy.policyValue);
      const valueToPay = this.calculatePaymentValue(policyValue, paymentFrequency, policy.numberOfPayments);
      let nextPaymentNumber = maxPaymentNumber + 1;
      let currentDate = new Date(renewalDate);
      const today = new Date();

      // Crear el primer pago (el de renovación)
      const firstPayment: PaymentDTO = {
        policy_id: policy.id,
        number_payment: nextPaymentNumber,
        value: valueToPay,
        pending_value: policyValue - valueToPay,
        status_payment_id: 1, // 1: Pendiente
        credit: 0,
        balance: valueToPay,
        total: 0,
        observations: `Pago generado por renovación N° ${renewal.renewalNumber}`,
        createdAt: renewalDate
      };

      await this.paymentService.createPayment(firstPayment);
      nextPaymentNumber++;

      // Generar los pagos restantes del ciclo (hasta la fecha actual)
      for (let i = 1; i < paymentsPerCycle && currentDate <= today; i++) {
        // Avanzar la fecha según la frecuencia
        currentDate = this.advanceDate(currentDate, paymentFrequency, policy, renewalDate, paymentsPerCycle);

        // Solo crear el pago si la fecha es menor o igual a hoy
        if (currentDate <= today) {
          const payment: PaymentDTO = {
            policy_id: policy.id,
            number_payment: nextPaymentNumber,
            value: valueToPay,
            pending_value: i === paymentsPerCycle - 1 ? 0 : policyValue - (valueToPay * (i + 1)),
            status_payment_id: 1, // 1: Pendiente
            credit: 0,
            balance: valueToPay,
            total: 0,
            observations: `Pago del ciclo de renovación N° ${renewal.renewalNumber}`,
            createdAt: DateHelper.normalizeDateForComparison(new Date(currentDate))
          };

          await this.paymentService.createPayment(payment);
          nextPaymentNumber++;
        }
      }

    } catch (error) {
      console.error(`Error al crear renovación con pagos: ${error.message}`);
      throw ErrorManager.createSignatureError(`Error al crear renovación con pagos: ${error.message}`);
    }
  }

  // Invalidar cachés relacionados con pólizas
  private async invalidateCaches(): Promise<void> {
    await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES);
    await this.redisService.del('policies');
    await this.redisService.del('policiesStatus');
    await this.redisService.del('customers');
    await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES_BY_STATUS);
    await this.redisService.del('allAdvisors');

  }

  //1:metodo para registrar una poliza
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
      // Generar pagos utilizando el servicio de pagos (siempre generar al menos el primer pago)
      await this.generatePaymentsUsingService(newPolicy, startDate, today, paymentFrequency);
      // Crear renovaciones automáticas
      await this.handleRenewals(newPolicy, startDate, today);

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
          'commissionsPayments',
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

      // Obtener la póliza completa
      const policy = await this.findPolicyById(body.policy_id);
      // validar si la póliza existe antes de registrar la renovacion
      if (!policy) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      const createdAt = DateHelper.normalizeDateForDB(body.createdAt);
      body.createdAt = createdAt;

      const newRenewal = await this.policyRenevalMethod.save(body);

      // Verificar si es la primera renovación y generar pagos faltantes del ciclo 1
      if (body.renewalNumber === 1) {
        await this.generateMissingPaymentsBeforeRenewal(policy, new Date(policy.startDate), new Date(body.createdAt));
      }
      // Si es una renovación posterior, generar pagos entre la renovación anterior y esta
      else if (body.renewalNumber > 1) {
        const previousRenewalDate = new Date(policy.startDate);
        previousRenewalDate.setFullYear(previousRenewalDate.getFullYear() + (body.renewalNumber - 1));
        await this.generateMissingPaymentsBeforeRenewal(policy, previousRenewalDate, new Date(body.createdAt));
      }

      // Crear automáticamente el primer pago para el nuevo período
      await this.createFirstPaymentAfterRenewal(policy, newRenewal);

      // Invalidar cachés
      await this.invalidateCaches();
      return newRenewal;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //11: Método para crear el primer pago después de una renovación
  private async createFirstPaymentAfterRenewal(policy: PolicyEntity, renewal: RenewalEntity): Promise<void> {
    // Obtener todos los pagos existentes de la póliza
    const existingPolicy = await this.findPolicyById(policy.id);
    const existingPayments = existingPolicy.payments || [];

    // Encontrar el número más alto de pago existente
    const maxPaymentNumber = existingPayments.length > 0
      ? Math.max(...existingPayments.map(p => p.number_payment))
      : 0;

    // El siguiente número de pago es el máximo + 1
    const nextPaymentNumber = maxPaymentNumber + 1;

    // Calcular el valor a pagar según la frecuencia
    const policyValue = Number(policy.policyValue);
    const paymentFrequency = Number(policy.payment_frequency_id);
    const valueToPay = this.calculatePaymentValue(policyValue, paymentFrequency, policy.numberOfPayments);

    // Crear el nuevo pago
    const newPayment: PaymentDTO = {
      policy_id: policy.id,
      number_payment: nextPaymentNumber,
      value: valueToPay,
      pending_value: policyValue - valueToPay,
      status_payment_id: 1, // 1: Pendiente
      credit: 0,
      balance: valueToPay,
      total: 0,
      observations: `Pago generado por renovación N° ${renewal.renewalNumber}`,
      createdAt: renewal.createdAt
    };

    // Registrar el pago utilizando el servicio de pagos
    await this.paymentService.createPayment(newPayment);
  }

  // 12: Método para generar pagos faltantes entre dos fechas
  private async generateMissingPaymentsBeforeRenewal(policy: PolicyEntity, startDate: Date, endDate: Date): Promise<void> {
    const policyValue = Number(policy.policyValue);
    const paymentFrequency = Number(policy.payment_frequency_id);
    const valueToPay = this.calculatePaymentValue(policyValue, paymentFrequency, policy.numberOfPayments);

    // Obtener todos los pagos existentes de la póliza
    const existingPolicy = await this.findPolicyById(policy.id);
    const existingPayments = existingPolicy.payments || [];

    // Encontrar el número más alto de pago existente
    const maxPaymentNumber = existingPayments.length > 0
      ? Math.max(...existingPayments.map(p => p.number_payment))
      : 0;

    // Iniciar con el siguiente número de pago
    let paymentNumber = maxPaymentNumber + 1;

    // Calcular cuántos pagos deberían existir en este período según la frecuencia
    let currentDate = new Date(startDate);
    let accumulated = 0;

    while (currentDate < endDate) {
      // Verificar si ya existe un pago en esta fecha
      const existingPayment = existingPayments.find(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate.getFullYear() === currentDate.getFullYear() &&
          paymentDate.getMonth() === currentDate.getMonth() &&
          paymentDate.getDate() === currentDate.getDate();
      });

      // Si no existe un pago para esta fecha, crearlo
      if (!existingPayment) {
        accumulated += valueToPay;
        let pendingValue = policyValue - accumulated;
        if (pendingValue < 0) pendingValue = 0;

        const paymentData: PaymentDTO = {
          policy_id: policy.id,
          number_payment: paymentNumber,
          value: valueToPay,
          pending_value: pendingValue,
          status_payment_id: 1, // 1: Pendiente
          credit: 0,
          balance: valueToPay,
          total: 0,
          observations: 'Pago generado retroactivamente',
          createdAt: DateHelper.normalizeDateForDB(new Date(currentDate))
        };

        await this.paymentService.createPayment(paymentData);
        paymentNumber++;
      }
      // Avanzar la fecha según la frecuencia de pago
      currentDate = this.advanceDate(currentDate, paymentFrequency, policy, startDate, policy.numberOfPayments);

    }
  }
}