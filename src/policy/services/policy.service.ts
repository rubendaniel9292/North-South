import { PolicyTypeEntity } from './../entities/policy_type.entity';
import { ValidateEntity } from '@/helpers/validations';
import { Injectable } from '@nestjs/common';
import { PolicyEntity } from '../entities/policy.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, DataSource } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { PolicyDTO } from '../dto/policy.dto';
import { PolicyStatusService } from '@/helpers/policy.status';
import { PaymentFrequencyEntity } from '../entities/payment_frequency.entity';
import { PaymentMethodEntity } from '../entities/payment_method.entity';
import { RenewalEntity } from '../entities/renewal.entity';
import { PolicyRenewalDTO } from '../dto/policy.renewal.dto';
import { PaymentService } from '@/payment/services/payment.service'; // Asegúrate de importar el servicio de pagos
import { PaymentDTO } from '@/payment/dto/payment.dto';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CacheKeys } from '@/constants/cache.enum';
import { PolicyStatusEntity } from '../entities/policy_status.entity';
import { DateHelper } from '@/helpers/date.helper';
import { PolicyPeriodDataDTO } from '../dto/policy.period.data.dto';
import { PolicyPeriodDataEntity } from '../entities/policy_period_data.entity';
import { CommissionsPaymentsService } from '@/commissions-payments/services/commissions-payments.service';

import { PolicyConsistencyHelper } from '../helpers/policy-consistency.helper';
import { PaymentEntity } from '@/payment/entity/payment.entity';
@Injectable()
export class PolicyService extends ValidateEntity {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
    private readonly policyStatusService: PolicyStatusService,
    private readonly paymentService: PaymentService,
    private readonly commissionsPaymentsService: CommissionsPaymentsService,

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

    @InjectRepository(PolicyPeriodDataEntity)
    private readonly policyPeriodDataRepository: Repository<PolicyPeriodDataEntity>,

    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,

    private readonly policyConsistencyHelper: PolicyConsistencyHelper,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(policyRepository);
  }
  //función para obtener pagos por ciclo según frecuencia
  private getPaymentsPerCycle(
    paymentFrequency: number,
    numberOfPayments?: number,
  ): number {
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
  private advanceDate(
    currentDate: Date,
    paymentFrequency: number,
    policy?: PolicyEntity,
    startDate?: Date,
    paymentsPerCycle?: number,
  ): Date {
    const newDate = new Date(currentDate);

    // 🔥 CRÍTICO: Preservar el día original de la fecha de inicio para evitar drift
    const originalDay = startDate ? startDate.getDate() : currentDate.getDate();

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
          const daysBetween = Math.floor(
            (policy.endDate.getTime() - startDate.getTime()) / paymentsPerCycle,
          );
          newDate.setDate(newDate.getDate() + daysBetween);
        }
        // No ajustar día para frecuencia personalizada
        return newDate;
    }

    // 🔥 NUEVO: Restaurar el día original para evitar drift de fechas
    // Obtener el último día del mes destino para manejar casos edge (ej: 31 de enero → 28 de febrero)
    const lastDayOfMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth() + 1,
      0,
    ).getDate();

    // Usar el menor entre el día original y el último día del mes
    const dayToSet = Math.min(originalDay, lastDayOfMonth);
    newDate.setDate(dayToSet);

    return newDate;
  }
  //funcion para calcular el valor de cada pago según la frecuencia de pagos segun el número de pagos en el ciclo
  private calculatePaymentValue(
    policyValue: number,
    paymentFrequency: number,
    numberOfPayments?: number,
  ): number {
    // Obtener el número de pagos por ciclo según la frecuencia
    const paymentsPerCycle = this.getPaymentsPerCycle(
      paymentFrequency,
      numberOfPayments,
    );

    // Calcular el valor de cada pago
    let valueToPay = 0;

    if (paymentFrequency === 5) {
      // Caso especial para pagos personalizados
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
  // Utilidad para buscar el advisor_id si no lo tienes disponible
  private async getAdvisorIdByPolicyId(
    policyId: number,
  ): Promise<number | null> {
    try {
      const policy = await this.policyRepository.findOne({
        where: { id: policyId },
        select: ['advisor_id'],
      });
      return policy ? policy.advisor_id : null;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  // Generar pagos utilizando el servicio de pagos
  private async generatePaymentsUsingService(
    policy: PolicyEntity,
    startDate: Date,
    limitDate: Date,
    paymentFrequency: number,
  ): Promise<void> {
    try {
      console.log(
        `Generando pagos iniciales para póliza ${policy.id} desde ${startDate.toISOString()} hasta la primera renovación`,
      );
      const policyValue = Number(policy.policyValue);
      const valueToPay = this.calculatePaymentValue(
        policyValue,
        paymentFrequency,
        policy.numberOfPayments,
      );

      // Calcular la fecha de la primera renovación
      const firstRenewalDate = new Date(startDate);
      firstRenewalDate.setFullYear(startDate.getFullYear() + 1);

      // Si la fecha de renovación es mayor que hoy, usar hoy como límite
      const endDate =
        firstRenewalDate <= limitDate ? firstRenewalDate : limitDate;

      // Obtener la póliza actualizada con todos sus pagos
      const updatedPolicy = await this.findPolicyById(policy.id);
      const existingPayments = updatedPolicy.payments || [];

      // Verificar si ya existen pagos para esta póliza
      if (existingPayments.length > 0) {
        console.log(
          `La póliza ${policy.id} ya tiene ${existingPayments.length} pagos. No se generarán pagos iniciales.`,
        );
        return;
      }
      // Calcular cuántos pagos se deben generar según la frecuencia hasta la primera renovación
      const paymentsPerCycle = this.getPaymentsPerCycle(
        paymentFrequency,
        policy.numberOfPayments,
      );

      // Generar los pagos del ciclo inicial
      let currentDate = new Date(startDate);
      let paymentNumber = 1;

      // Crear un conjunto para rastrear fechas ya procesadas
      const processedDates = new Set<string>();

      for (let i = 0; i < paymentsPerCycle && currentDate < endDate; i++) {
        // Normalizar la fecha para comparación
        const normalizedDate =
          DateHelper.normalizeDateForComparison(currentDate);
        const dateKey = normalizedDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        // Si no hemos procesado esta fecha antes
        if (!processedDates.has(dateKey)) {
          processedDates.add(dateKey);

          // Calcular el valor pendiente
          const pendingValue =
            i === paymentsPerCycle - 1 ? 0 : policyValue - valueToPay * (i + 1);

          const paymentData: PaymentDTO = {
            policy_id: policy.id,
            number_payment: paymentNumber,
            value: valueToPay,
            pending_value: pendingValue,
            status_payment_id: 1, // 1: Pendiente
            credit: 0,
            balance: valueToPay,
            total: 0,
            observations:
              i === 0
                ? 'Pago inicial de la póliza'
                : `Pago N° ${paymentNumber} del ciclo inicial`,
            createdAt:
              i === 0
                ? policy.startDate
                : DateHelper.normalizeDateForComparison(new Date(currentDate)),
          };

          console.log(
            `Creando pago inicial #${paymentNumber} para fecha ${currentDate.toISOString()} con valor pendiente ${pendingValue}`,
          );
          await this.paymentService.createPayment(paymentData);
          paymentNumber++;
        }
        // Avanzar la fecha según la frecuencia de pago
        currentDate = this.advanceDate(
          currentDate,
          paymentFrequency,
          policy,
          startDate,
          paymentsPerCycle,
        );
      }

      console.log(
        `Se crearon ${paymentNumber - 1} pagos iniciales para la póliza ${policy.id}`,
      );
    } catch (error) {
      console.error(`Error al generar pagos iniciales: ${error.message}`);
      throw ErrorManager.createSignatureError(
        `Error al generar pagos iniciales: ${error.message}`,
      );
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

  /**
   * 🔄 Método auxiliar para calcular el AÑO DEL PERÍODO basándose en aniversarios de póliza
   *
   * Un período = 12 meses desde la fecha de inicio
   * Devuelve el AÑO CALENDARIO del inicio de ese período, no el número de período
   *
   * Ejemplos:
   * - startDate: 25/02/2023, referenceDate: 25/02/2023 → year = 2023
   * - startDate: 25/02/2023, referenceDate: 25/02/2024 → year = 2024
   * - startDate: 25/02/2023, referenceDate: 25/02/2025 → year = 2025
   *
   * @param startDate - Fecha de inicio de la póliza
   * @param referenceDate - Fecha a usar para calcular el período (puede ser fecha de renovación o fecha actual)
   * @returns Año del período (2023, 2024, 2025, etc.)
   */
  private calculatePolicyPeriodNumber(
    startDate: Date,
    referenceDate: Date,
  ): number {
    const normalizedStart = new Date(startDate);
    const normalizedRef = new Date(referenceDate);

    // Calcular diferencia en meses
    let months =
      (normalizedRef.getFullYear() - normalizedStart.getFullYear()) * 12;
    months += normalizedRef.getMonth() - normalizedStart.getMonth();

    // Si el día aún no ha llegado en el mes de referencia, restar 1 mes
    if (normalizedRef.getDate() < normalizedStart.getDate()) {
      months--;
    }

    // Calcular cuántos períodos completos (de 12 meses) han pasado
    const periodsElapsed = Math.floor(months / 12);

    // El año del período = año de inicio + períodos transcurridos
    const periodYear = normalizedStart.getFullYear() + periodsElapsed;

    return periodYear;
  }

  // Manejar renovaciones automáticas
  private async handleRenewals(
    policy: PolicyEntity,
    startDate: Date,
    limitDate: Date,
  ): Promise<void> {
    const yearsDifference = limitDate.getFullYear() - startDate.getFullYear();
    if (yearsDifference > 0) {
      for (let i = 1; i <= yearsDifference; i++) {
        //const renewalDate = new Date(startDate);
        const renewalDate = new Date(startDate);
        renewalDate.setFullYear(startDate.getFullYear() + i);

        // Solo crear renovaciones ANTES de limitDate (no en limitDate mismo)
        if (renewalDate < limitDate) {
          // Normalizar la fecha de renovación
          const normalizedRenewalDate =
            DateHelper.normalizeDateForComparison(renewalDate);

          // Crear la renovación
          const renewalData: PolicyRenewalDTO = {
            policy_id: policy.id,
            renewalNumber: i,
            observations: `Renovación automática año/periodo N° ${i}`,
            createdAt: normalizedRenewalDate,
          };

          // Crear la renovación y generar solo los pagos necesarios según la frecuencia
          await this.createRenewalWithPayments(
            renewalData,
            policy,
            normalizedRenewalDate,
            limitDate,
          );
        }
      }
    }
  }

  // Método para crear una renovación y sus pagos correspondientes
  private async createRenewalWithPayments(
    renewalData: PolicyRenewalDTO,
    policy: PolicyEntity,
    renewalDate: Date,
    limitDate: Date, // NUEVO: límite de generación (endDate para culminadas, today para activas)
  ): Promise<void> {
    try {
      // 1. Crear la renovación
      const renewal = await this.policyRenevalMethod.save(renewalData);

      // 1.1 Crear el período basándose en ANIVERSARIOS de póliza (no en años calendario)
      const renewalPeriodNumber = this.calculatePolicyPeriodNumber(
        policy.startDate,
        renewalData.createdAt,
      );
      const renewalPeriodData: PolicyPeriodDataDTO = {
        policy_id: policy.id,
        year: renewalPeriodNumber, // Usar número de período, no año calendario
        policyValue: policy.policyValue,
        agencyPercentage: policy.agencyPercentage,
        advisorPercentage: policy.advisorPercentage,
        policyFee: policy.policyFee,
      };
      await this.createOrUpdatePeriodForPolicy(
        policy.id,
        renewalPeriodNumber,
        renewalPeriodData,
      );
      console.log('Creando periodo de renovación (aniversario)', {
        policyId: policy.id,
        periodNumber: renewalPeriodNumber,
        renewalDate: renewalData.createdAt,
      });

      // 2. Obtener la póliza actualizada con todos sus pagos
      const updatedPolicy = await this.findPolicyById(policy.id);
      const existingPayments = updatedPolicy.payments || [];

      // 3. Encontrar el número más alto de pago existente
      const maxPaymentNumber =
        existingPayments.length > 0
          ? Math.max(...existingPayments.map((p) => p.number_payment))
          : 0;

      // 4. Calcular cuántos pagos se deben generar según la frecuencia
      const paymentFrequency = Number(policy.payment_frequency_id);
      const paymentsPerCycle = this.getPaymentsPerCycle(
        paymentFrequency,
        policy.numberOfPayments,
      );

      // 5. Generar solo los pagos necesarios para este ciclo (hasta limitDate)
      const policyValue = Number(policy.policyValue);
      const valueToPay = this.calculatePaymentValue(
        policyValue,
        paymentFrequency,
        policy.numberOfPayments,
      );
      let nextPaymentNumber = maxPaymentNumber + 1;
      let currentDate = new Date(renewalDate);

      // Crear el primer pago (el de renovación)
      const firstPayment: PaymentDTO = {
        policy_id: policy.id,
        number_payment: nextPaymentNumber,
        value: valueToPay,
        // 🔥 CRÍTICO: Si solo hay 1 pago en el ciclo, pending_value debe ser 0
        pending_value: paymentsPerCycle === 1 ? 0 : policyValue - valueToPay,
        status_payment_id: 1, // 1: Pendiente
        credit: 0,
        balance: valueToPay,
        total: 0,
        observations: `Pago generado por renovación N° ${renewal.renewalNumber}`,
        createdAt: renewalDate,
      };

      await this.paymentService.createPayment(firstPayment);
      nextPaymentNumber++;

      // Generar los pagos restantes del ciclo (hasta limitDate)
      for (let i = 1; i < paymentsPerCycle && currentDate <= limitDate; i++) {
        // Avanzar la fecha según la frecuencia
        currentDate = this.advanceDate(
          currentDate,
          paymentFrequency,
          policy,
          renewalDate,
          paymentsPerCycle,
        );

        // Solo crear el pago si la fecha es menor o igual a limitDate
        if (currentDate <= limitDate) {
          const payment: PaymentDTO = {
            policy_id: policy.id,
            number_payment: nextPaymentNumber,
            value: valueToPay,
            pending_value:
              i === paymentsPerCycle - 1
                ? 0
                : policyValue - valueToPay * (i + 1),
            status_payment_id: 1, // 1: Pendiente
            credit: 0,
            balance: valueToPay,
            total: 0,
            observations: `Pago del ciclo de renovación N° ${renewal.renewalNumber}`,
            createdAt: DateHelper.normalizeDateForComparison(
              new Date(currentDate),
            ),
          };

          await this.paymentService.createPayment(payment);
          nextPaymentNumber++;
        }
      }
    } catch (error) {
      console.error(`Error al crear renovación con pagos: ${error.message}`);
      throw ErrorManager.createSignatureError(
        `Error al crear renovación con pagos: ${error.message}`,
      );
    }
  }

  // Invalidar cachés relacionados con pólizas
  private async invalidateCaches(
    advisorId?: number,
    policyId?: number,
  ): Promise<void> {
    try {
      // ✅ CRÍTICO: Incrementar versión del caché para invalidar todas las variantes
      const versionKey = 'policies_cache_version';
      const newVersion = Date.now().toString();
      await this.redisService.set(versionKey, newVersion, 86400); // 24 horas
      console.log(`🔄 Cache version actualizada a: ${newVersion}`);

      // Cachés globales
      await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES);
      await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES + '_optimized'); // ⭐ AGREGAR CACHÉ OPTIMIZADO
      await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES_BY_STATUS);
      await this.redisService.del(CacheKeys.GLOBAL_POLICY_STATUS);
      await this.redisService.del('customers');
      await this.redisService.del('allAdvisors');

      // ✅ CRÍTICO: Invalidar cache de payments después de renovaciones
      await this.redisService.del('payments');
      await this.redisService.del('paymentsByStatus:general');

      // ✅ CRÍTICO: Cachés de comisiones que dependen de valores de períodos
      await this.redisService.del(CacheKeys.GLOBAL_COMMISSIONS); // ⭐ ESTA ERA LA CLAVE CRÍTICA FALTANTE
      await this.redisService.del('commissions');
      await this.redisService.del('commissionsPayments');
      await this.redisService.del('commissionsByStatus:general');
      await this.redisService.del('allCommissions');

      // Cachés específicos del asesor (solo si advisorId existe y no es null)
      if (advisorId) {
        await this.redisService.del(`advisor:${advisorId}`);
        await this.redisService.del(`advisor:${advisorId}:policies`);
        await this.redisService.del(`advisor:${advisorId}:commissions`);
        await this.redisService.del(`advisor:${advisorId}:payments`);
      }

      // Cachés específicos de la póliza (solo si policyId existe y no es null)
      if (policyId) {
        await this.redisService.del(`policy:${policyId}`);
        await this.redisService.del(`policy:${policyId}:periods`);
        await this.redisService.del(`policy:${policyId}:renewals`);
        await this.redisService.del(`policy:${policyId}:commissions`);
      }
    } catch (error) {
      console.warn(
        '⚠️ Warning: Could not invalidate some cache keys:',
        error.message,
      );
    }
  }

  // Método de diagnóstico para el caché
  public async diagnoseCacheStatus(search?: string): Promise<any> {
    try {
      const cacheKey = CacheKeys.GLOBAL_ALL_POLICIES;
      const cachedData = await this.redisService.get(cacheKey);

      const cacheOptimizedKey = CacheKeys.GLOBAL_ALL_POLICIES + '_optimized';
      const cachedOptimizedData =
        await this.redisService.get(cacheOptimizedKey);

      // Si hay búsqueda, también verificar esas claves
      let searchCacheStatus = null;
      if (search) {
        const searchKey = `policies_optimized:${search}`;
        const searchCachedData = await this.redisService.get(searchKey);
        searchCacheStatus = {
          searchKey,
          hasSearchCachedData: !!searchCachedData,
          searchCachedDataLength: searchCachedData
            ? JSON.parse(searchCachedData).length
            : 0,
        };
      }

      return {
        cacheKey,
        hasCachedData: !!cachedData,
        cachedDataLength: cachedData ? JSON.parse(cachedData).length : 0,
        cacheOptimizedKey,
        hasCachedOptimizedData: !!cachedOptimizedData,
        cachedOptimizedDataLength: cachedOptimizedData
          ? JSON.parse(cachedOptimizedData).length
          : 0,
        searchCacheStatus,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
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
      const determinedStatus =
        await this.policyStatusService.determineNewPolicyStatus(endDate);
      body.policy_status_id = determinedStatus.id;

      // Crear la póliza en la base de datos
      const newPolicy = await this.policyRepository.save(body);

      // Validar el valor de la póliza
      this.validatePolicyValue(Number(newPolicy.policyValue));

      const paymentFrequency = Number(newPolicy.payment_frequency_id);
      const today = new Date();

      // 🔥 CRÍTICO: Detectar si la póliza está culminada desde el inicio
      const normalizedEndDate = DateHelper.normalizeDateForComparison(endDate);
      const normalizedToday = DateHelper.normalizeDateForComparison(today);
      const isPolicyAlreadyExpired = normalizedEndDate <= normalizedToday;

      if (isPolicyAlreadyExpired) {
        console.log(
          `⚠️ [createPolicy] Póliza ${newPolicy.id} está CULMINADA desde el inicio`,
        );
        console.log(
          `   endDate: ${normalizedEndDate.toISOString().split('T')[0]} <= today: ${normalizedToday.toISOString().split('T')[0]}`,
        );
        console.log(`   Generando datos SOLO hasta endDate, NO hasta hoy`);
      }

      // Determinar límite de generación: endDate si está culminada, today si está activa
      const generationLimit = isPolicyAlreadyExpired
        ? normalizedEndDate
        : today;

      // Generar pagos hasta el límite correcto
      await this.generatePaymentsUsingService(
        newPolicy,
        startDate,
        generationLimit,
        paymentFrequency,
      );

      // Crear renovaciones hasta el límite correcto
      await this.handleRenewals(newPolicy, startDate, generationLimit);

      // Crear el período inicial (usar 'today' para calcular el período correcto, no generationLimit)
      const initialPeriodNumber = this.calculatePolicyPeriodNumber(
        newPolicy.startDate,
        today,
      );
      const initialPeriodData: PolicyPeriodDataDTO = {
        policy_id: newPolicy.id,
        year: initialPeriodNumber,
        policyValue: newPolicy.policyValue,
        agencyPercentage: newPolicy.agencyPercentage,
        advisorPercentage: newPolicy.advisorPercentage,
        policyFee: newPolicy.policyFee,
      };
      await this.createOrUpdatePeriodForPolicy(
        newPolicy.id,
        initialPeriodNumber,
        initialPeriodData,
      );
      console.log('Creando periodo inicial (aniversario)', {
        policyId: newPolicy.id,
        periodNumber: initialPeriodNumber,
      });

      // 🔥 CRÍTICO: Solo ejecutar ensureConsistency si la póliza está ACTIVA
      // Si está culminada, NO ejecutar (evita generar datos hasta hoy)
      if (!isPolicyAlreadyExpired) {
        console.log(`📅 Póliza activa - Asegurando consistencia hasta hoy`);

        // Cargar póliza con todas las relaciones necesarias
        const reloadedPolicy = await this.findPolicyById(newPolicy.id);
        const result = await this.policyConsistencyHelper.ensureConsistency(
          reloadedPolicy,
          this.advanceDate.bind(this),
          this.getPaymentsPerCycle.bind(this),
          this.calculatePaymentValue.bind(this),
        );

        if (
          result.renewalsCreated > 0 ||
          result.periodsCreated > 0 ||
          result.paymentsCreated > 0
        ) {
          console.log(
            `✅ Consistencia asegurada para nueva póliza ${newPolicy.id} - Renovaciones: ${result.renewalsCreated}, Períodos: ${result.periodsCreated}, Pagos: ${result.paymentsCreated}`,
          );
        }
      } else {
        console.log(
          `⏭️ Póliza culminada - Saltando ensureConsistency (evita generar datos hasta hoy)`,
        );

        // 🔥 CRÍTICO: NO usar findPolicyById porque ejecuta validateAndCreateMissingPeriods
        // Cargar manualmente la póliza con solo las relaciones necesarias
        const reloadedPolicy = await this.policyRepository.findOne({
          where: { id: newPolicy.id },
          relations: ['payments', 'renewals', 'periods'],
        });

        if (reloadedPolicy) {
          console.log(`🧹 Ejecutando limpieza de datos posteriores a endDate`);
          await this.validateAndCleanupPayments(reloadedPolicy);
        }
      }

      await this.invalidateCaches(newPolicy.advisor_id, newPolicy.id);

      return newPolicy;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //2:metodo para consultas todas las polizas (INCLUYE PAYMENTS - PUEDE CAUSAR MEMORY LEAK)
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
          'commissionRefunds',
          'periods',
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

      // Solo guardar en caché si NO hay búsqueda específica
      if (!search) {
        await this.redisService.set(
          CacheKeys.GLOBAL_ALL_POLICIES,
          JSON.stringify(policies),
          32400,
        ); // TTL de 9 horas
      }

      //console.log(policies)
      return policies;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2B: Método OPTIMIZADO para consultar todas las políticas CON solo el último pago (SIN SUBCONSULTAS)
  public getAllPoliciesOptimized = async (
    search?: string,
  ): Promise<PolicyEntity[]> => {
    try {
      // 🔄 Sistema de versionado de caché (elimina race conditions)
      const versionKey = 'policies_cache_version';
      const cacheVersion =
        (await this.redisService.get(versionKey)) || Date.now().toString();

      // Clave de caché versionada
      const baseCacheKey = search
        ? `policies_optimized:${search}`
        : `${CacheKeys.GLOBAL_ALL_POLICIES}_optimized`;
      const cacheKey = `${baseCacheKey}:v${cacheVersion}`;

      console.log(`🔍 Buscando caché con versión: ${cacheVersion}`);

      // Verificar caché primero
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        console.log(
          `✅ Cache hit - Retornando ${JSON.parse(cachedData).length} pólizas (v${cacheVersion})`,
        );
        return JSON.parse(cachedData);
      }

      console.log(`❌ Cache miss - Consultando BD`);

      // Crea un array de condiciones de búsqueda
      const whereConditions: any[] = [];

      if (search) {
        const searchCondition = Like(`%${search}%`);
        whereConditions.push({ numberPolicy: searchCondition });
      }

      // 1️⃣ Cargar pólizas SIN pagos
      const policies: PolicyEntity[] = await this.policyRepository.find({
        order: {
          id: 'DESC',
        },
        where: whereConditions.length > 0 ? whereConditions : undefined,
        relations: [
          'policyType',
          'policyStatus',
          'paymentFrequency',
          'company',
          'customer',
        ],
        select: {
          numberPolicy: true,
          id: true,
          startDate: true,
          endDate: true,
          coverageAmount: true,
          company: {
            id: true,
            companyName: true,
          },
          customer: {
            id: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },
        },
      });

      if (!policies || policies.length === 0) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      const policyIds = policies.map((p) => p.id);
      console.log(`📋 ${policies.length} pólizas cargadas`);

      // 2️⃣ Cargar TODOS los pagos de esas pólizas (query simple, sin subconsulta)
      console.log(`💳 Cargando pagos para ${policyIds.length} pólizas...`);
      const startTime = Date.now();

      try {
        // Query SIMPLE: solo WHERE policy_id IN (...)
        const allPayments = await this.paymentRepository
          .createQueryBuilder('payment')
          .select([
            'payment.id',
            'payment.policy_id',
            'payment.number_payment',
            'payment.pending_value',
            'payment.value',
            'payment.createdAt',
          ])
          .where('payment.policy_id IN (:...policyIds)', { policyIds })
          .orderBy('payment.policy_id', 'ASC')
          .addOrderBy('payment.number_payment', 'DESC')
          .getMany();

        const endTime = Date.now();
        console.log(
          `✅ ${allPayments.length} pagos cargados en ${endTime - startTime}ms`,
        );

        // 3️⃣ En memoria: seleccionar solo el último pago de cada póliza
        const lastPaymentsByPolicy = new Map<number, PaymentEntity>();

        allPayments.forEach((payment) => {
          const existingPayment = lastPaymentsByPolicy.get(payment.policy_id);

          // Si no hay pago para esta póliza, o este tiene número mayor, guardarlo
          if (
            !existingPayment ||
            payment.number_payment > existingPayment.number_payment
          ) {
            lastPaymentsByPolicy.set(payment.policy_id, payment);
          }
        });

        console.log(
          `📊 ${lastPaymentsByPolicy.size} últimos pagos seleccionados en memoria`,
        );

        // 4️⃣ Asignar el último pago a cada póliza
        policies.forEach((policy) => {
          const lastPayment = lastPaymentsByPolicy.get(policy.id);
          policy.payments = lastPayment ? [lastPayment] : [];
        });
      } catch (paymentError) {
        console.error('❌ ERROR al cargar pagos:', paymentError.message);
        // Fallback: continuar sin pagos
        policies.forEach((policy) => {
          policy.payments = [];
        });
        console.warn('⚠️ Continuando SIN PAGOS debido a error');
      }

      // Cachear con clave versionada (solo si no hay búsqueda)
      if (!search) {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(policies),
          3600, // TTL de 1 hora
        );
        console.log(
          `✅ Pólizas cacheadas con versión ${cacheVersion} (TTL: 1h)`,
        );
      }

      return policies;
    } catch (error) {
      console.error(
        '❌ ERROR CRÍTICO en getAllPoliciesOptimized:',
        error.message,
      );
      console.error('Stack completo:', error.stack);
      throw ErrorManager.createSignatureError(
        `Error al obtener pólizas optimizadas: ${error.message}`,
      );
    }
  };

  //2C: Método PAGINADO para obtener polizas (MÁXIMO CONTROL DE MEMORIA)
  public getAllPoliciesPaginated = async (
    page: number = 1,
    limit: number = 50,
    search?: string,
  ): Promise<{
    policies: PolicyEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    try {
      const offset = (page - 1) * limit;

      // Limitar el máximo de registros por página para evitar memory leaks
      if (limit > 100) {
        limit = 100;
      }

      // Cache específico para paginación
      const cacheKey = search
        ? `policies_paginated:${page}:${limit}:${search}`
        : `policies_paginated:${page}:${limit}`;

      const cachedResult = await this.redisService.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      // Condiciones de búsqueda
      const whereConditions: any[] = [];
      if (search) {
        const searchCondition = Like(`%${search}%`);
        whereConditions.push({ numberPolicy: searchCondition });
      }

      // Contar total de registros
      const total = await this.policyRepository.count({
        where: whereConditions.length > 0 ? whereConditions : undefined,
      });

      // VERSIÓN PAGINADA SIN relaciones pesadas
      const policies: PolicyEntity[] = await this.policyRepository.find({
        order: {
          id: 'DESC',
        },
        where: whereConditions.length > 0 ? whereConditions : undefined,
        relations: [
          'policyType',
          'policyStatus',
          'paymentFrequency',
          'company',
          'customer',
          // SIN 'payments', 'payments.paymentStatus', 'renewals', 'commissionRefunds', 'periods'
        ],
        select: {
          company: {
            id: true,
            companyName: true,
          },

          customer: {
            id: true,
            ci_ruc: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },
        },
        skip: offset,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      const result = {
        policies,
        total,
        page,
        totalPages,
      };

      // Cache con TTL corto
      await this.redisService.set(
        cacheKey,
        JSON.stringify(result),
        3600, // TTL de 1 hora
      );

      return result;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2D: Método SÚPER LIGERO solo para contar pólizas (para el contador del frontend)
  public countAllPolicies = async (): Promise<number> => {
    try {
      // Cachear el conteo por 5 minutos (se actualiza frecuentemente)
      const cacheKey = 'policies_count';
      const cachedCount = await this.redisService.get(cacheKey);

      if (cachedCount) {
        console.log(`✅ Count cache hit: ${cachedCount} pólizas`);
        return parseInt(cachedCount, 10);
      }

      console.log('❌ Count cache miss - Consultando BD');

      // Solo COUNT(*), sin relaciones ni datos
      const count = await this.policyRepository.count();

      // Cachear por 5 minutos (300 segundos)
      await this.redisService.set(cacheKey, count.toString(), 300);

      console.log(`📊 Total pólizas: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Error al contar pólizas:', error.message);
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
          'advisor',
          'policyType',
          'policyStatus',
          'paymentFrequency',
          'company',
          'customer',
          'paymentMethod',
          'bankAccount',
          'bankAccount.bank',
          'creditCard',
          'creditCard.bank',
        ],
        select: {
          id: true,
          numberPolicy: true,
          coverageAmount: true,
          policyValue: true,
          startDate: true,
          endDate: true,
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
            id: true,
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
      await this.redisService.set(
        CacheKeys.GLOBAL_POLICY_TYPE,
        JSON.stringify(types),
        32400,
      ); // TTL de 1 hora
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
      console.log(`🔍 [findPolicyById] Iniciando búsqueda de póliza ID: ${id}`);

      // ✅ CRÍTICO: Validar y crear periodos faltantes PRIMERO (antes de cargar la póliza)
      // Esto garantiza que la consulta siguiente incluya los periodos recién creados
      const validationResult = await this.validateAndCreateMissingPeriods(id);
      console.log(
        `📊 [findPolicyById] Resultado de validación:`,
        validationResult,
      );

      // Si se crearon periodos, esperar un momento para asegurar commit completo
      if (validationResult.created > 0) {
        console.log(
          `⏳ [findPolicyById] Esperando commit de ${validationResult.created} periodos...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms de espera
      }

      // Ahora cargar la póliza con TODOS los periodos actualizados
      const policyId: PolicyEntity = await this.policyRepository.findOne({
        where: { id },
        cache: false, // 👈 Deshabilitar caché de TypeORM para evitar datos obsoletos
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
          'commissions',
          'commissionRefunds',
          'periods', // ✅ Ahora incluirá los periodos recién creados
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

          // ✅ CRÍTICO: Especificar explícitamente los campos de periods
          periods: {
            id: true,
            policy_id: true,
            year: true,
            policyValue: true,
            agencyPercentage: true,
            advisorPercentage: true,
            policyFee: true,
          },
        },
        order: {
          payments: {
            id: 'DESC',
          },
          renewals: {
            id: 'DESC',
          },
          periods: {
            year: 'ASC',
          },
        },
      });

      if (!policyId || policyId === undefined) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      // ✅ FALLBACK: Si aún no hay periodos, recargarlos explícitamente
      if (!policyId.periods || policyId.periods.length === 0) {
        console.warn(
          `⚠️ [findPolicyById] Recargando periodos explícitamente para póliza ${id}`,
        );
        policyId.periods = await this.policyPeriodDataRepository.find({
          where: { policy_id: id },
          order: { year: 'ASC' },
        });
        console.log(
          `🔄 [findPolicyById] Periodos recargados: ${policyId.periods.length}`,
        );
      }

      console.log(
        `✅ [findPolicyById] Póliza cargada. Periodos encontrados: ${policyId.periods?.length || 0}`,
      );
      if (policyId.periods && policyId.periods.length > 0) {
        console.log(
          `📅 [findPolicyById] Años de periodos:`,
          policyId.periods.map((p) => p.year),
        );
      } else {
        console.warn(
          `⚠️ [findPolicyById] ADVERTENCIA: La póliza ${id} no tiene periodos después de la validación y recarga`,
        );
      }

      return policyId;
    } catch (error) {
      console.error(
        `❌ [findPolicyById] Error al buscar póliza ${id}:`,
        error.message,
      );
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
      console.log('Datos de actualización recibidos:', updateData);
      const policy: PolicyEntity = await this.policyRepository.findOne({
        where: { id },
      });

      if (!policy) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      // 🔥 PRIMERO: Validar y corregir fechas de pagos inconsistentes
      // Esto se ejecuta SIEMPRE, incluso si no hay cambios en la póliza
      try {
        console.log(
          `🔍 [updatedPolicy] Validando consistencia de fechas de pagos para póliza ${id}`,
        );

        // Cargar póliza con pagos y renovaciones
        const policyWithPayments = await this.policyRepository.findOne({
          where: { id },
          relations: ['payments', 'renewals'],
        });

        if (
          policyWithPayments &&
          policyWithPayments.payments &&
          policyWithPayments.payments.length > 0
        ) {
          const startDate = new Date(policyWithPayments.startDate);
          const renewals = policyWithPayments.renewals || [];
          const payments = policyWithPayments.payments;

          // 🔥 CRÍTICO: Obtener el día de aniversario de la última renovación (o startDate si no hay renovaciones)
          let anniversaryDay = startDate.getDate();

          if (renewals.length > 0) {
            const lastRenewal = renewals.reduce((latest, r) =>
              new Date(r.createdAt) > new Date(latest.createdAt) ? r : latest,
            );
            anniversaryDay = new Date(lastRenewal.createdAt).getDate();
            console.log(
              `📅 Día de aniversario (última renovación): ${anniversaryDay}`,
            );
          } else {
            console.log(
              `📅 Día de aniversario (fecha inicio): ${anniversaryDay}`,
            );
          }

          let paymentsDeleted = 0;
          let paymentsCorrected = 0;
          const deletedPaymentDetails: string[] = [];
          const correctedPaymentDetails: string[] = [];

          // Para cada pago, verificar si su fecha excede el ciclo correspondiente
          for (const payment of payments) {
            const paymentDate = new Date(payment.createdAt);
            const paymentDay = paymentDate.getDate();

            // Determinar a qué ciclo pertenece el pago basándose en renovaciones
            let cycleStart = new Date(startDate);
            let cycleEnd = new Date(startDate);
            cycleEnd.setFullYear(cycleStart.getFullYear() + 1);

            // Buscar el ciclo correcto basándose en renovaciones
            const sortedRenewals = [...renewals].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            );

            for (const renewal of sortedRenewals) {
              const renewalDate = new Date(renewal.createdAt);
              if (paymentDate >= renewalDate) {
                cycleStart = new Date(renewalDate);
                cycleEnd = new Date(renewalDate);
                cycleEnd.setFullYear(cycleStart.getFullYear() + 1);
              }
            }

            // Verificar si el pago excede el ciclo (está en o después del próximo aniversario)
            if (paymentDate >= cycleEnd) {
              console.log(
                `⚠️ Pago #${payment.number_payment} tiene fecha inconsistente:`,
              );
              console.log(
                `   Fecha del pago: ${paymentDate.toISOString().split('T')[0]}`,
              );
              console.log(
                `   Ciclo válido: ${cycleStart.toISOString().split('T')[0]} - ${cycleEnd.toISOString().split('T')[0]}`,
              );
              console.log(`   🗑️ Eliminando pago inconsistente...`);

              await this.paymentRepository.remove(payment);
              paymentsDeleted++;
              deletedPaymentDetails.push(
                `Pago #${payment.number_payment} (fecha: ${paymentDate.toISOString().split('T')[0]}, excede ciclo que termina ${cycleEnd.toISOString().split('T')[0]})`,
              );
            }
            // 🔥 MEJORADO: Corregir el día si no coincide con el día de aniversario o está adelantado
            else if (paymentDay != anniversaryDay) {
              // Obtener el último día del mes del pago
              const lastDayOfMonth = new Date(
                paymentDate.getFullYear(),
                paymentDate.getMonth() + 1,
                0,
              ).getDate();

              // Usar el menor entre el día original y el último día del mes
              const correctedDay = Math.min(anniversaryDay, lastDayOfMonth);

              // Calcular diferencia de días (si el pago está adelantado)
              const dayDifference = paymentDay - correctedDay;

              if (paymentDay != correctedDay) {
                const oldDate = new Date(paymentDate);

                // 🔥 CRÍTICO: Si el día está adelantado más de 1 día, es un error del normalizeDateForDB
                // Restar los días de más
                if (dayDifference > 1) {
                  console.log(
                    `⚠️ Pago #${payment.number_payment} está adelantado ${dayDifference} días (probable uso incorrecto de normalizeDateForDB)`,
                  );
                  paymentDate.setDate(paymentDate.getDate() - dayDifference);
                } else {
                  // Corrección normal del día
                  paymentDate.setDate(correctedDay);
                }

                console.log(
                  `🔧 Corrigiendo día del pago #${payment.number_payment}:`,
                );
                console.log(`   Día esperado (aniversario): ${anniversaryDay}`);
                console.log(`   Día actual: ${paymentDay}`);
                console.log(
                  `   Diferencia: ${dayDifference > 0 ? `+${dayDifference} días` : `${dayDifference} días`}`,
                );
                console.log(
                  `   Fecha anterior: ${oldDate.toISOString().split('T')[0]}`,
                );
                console.log(
                  `   Fecha corregida: ${paymentDate.toISOString().split('T')[0]}`,
                );

                // 🔥 CRÍTICO: Usar normalizeDateForComparison para evitar sumar otro día
                payment.createdAt =
                  DateHelper.normalizeDateForComparison(paymentDate);
                await this.paymentRepository.save(payment);
                paymentsCorrected++;
                correctedPaymentDetails.push(
                  `Pago #${payment.number_payment} (${oldDate.toISOString().split('T')[0]} → ${paymentDate.toISOString().split('T')[0]}, diferencia: ${dayDifference > 0 ? `+${dayDifference}d` : `${dayDifference}d`})`,
                );
              }
            }
          }

          if (paymentsDeleted > 0 || paymentsCorrected > 0) {
            console.log(`✅ [updatedPolicy] Corrección de fechas completada:`);
            if (paymentsDeleted > 0) {
              console.log(`   - Pagos eliminados: ${paymentsDeleted}`);
              deletedPaymentDetails.forEach((detail) =>
                console.log(`     • ${detail}`),
              );
            }
            if (paymentsCorrected > 0) {
              console.log(`   - Pagos corregidos: ${paymentsCorrected}`);
              correctedPaymentDetails.forEach((detail) =>
                console.log(`     • ${detail}`),
              );
            }

            // Invalidar cachés para reflejar los cambios
            await this.invalidateCaches(policyWithPayments.advisor_id, id);
          } else {
            console.log(
              `✅ [updatedPolicy] No se encontraron pagos con fechas inconsistentes`,
            );
          }
        }
      } catch (dateValidationError) {
        console.error(
          `❌ Error al validar fechas de pagos: ${dateValidationError.message}`,
        );
        // No lanzar el error para que la actualización continúe
      }

      const oldAdvisorId = policy.advisor_id; // Guarda el asesor anterior
      const oldStartDate = policy.startDate; // Guarda la fecha de inicio anterior
      const oldFrequencyId = policy.payment_frequency_id; // Guarda la frecuencia anterior

      const startDate = updateData.startDate
        ? DateHelper.normalizeDateForDB(updateData.startDate)
        : policy.startDate;
      const endDate = updateData.endDate
        ? DateHelper.normalizeDateForDB(updateData.endDate)
        : policy.endDate;
      updateData.startDate = startDate;
      updateData.endDate = endDate;

      // 🔧 NUEVO: Detectar si la startDate cambió para ajustar fechas de pagos
      const startDateChanged =
        updateData.startDate &&
        DateHelper.normalizeDateForComparison(oldStartDate).getTime() !=
          DateHelper.normalizeDateForComparison(startDate).getTime();

      // 🔄 NUEVO: Detectar cambio de frecuencia de pago
      const frequencyChanged =
        updateData.payment_frequency_id != null &&
        oldFrequencyId != updateData.payment_frequency_id;

      // Respetar el estado "Cancelado" enviado desde el frontend
      if (updateData.policy_status_id != 2) {
        // Determinar el estado basado en las fechas solo si no es "Cancelado"
        const determinedStatus =
          await this.policyStatusService.determineNewPolicyStatus(endDate);
        updateData.policy_status_id = determinedStatus.id;
      }

      // 🔥 CRÍTICO: Detectar si se cambió a Cancelada o Culminada manualmente
      const oldStatus = policy.policy_status_id;
      const newStatus = updateData.policy_status_id || oldStatus;
      const statusChangedToCancelledOrCompleted =
        (newStatus == 2 || newStatus == 3) && oldStatus != newStatus;

      // 🆕 DETECTAR REACTIVACIÓN (de Cancelada/Culminada → Activa)
      const wasInactive = oldStatus == 2 || oldStatus == 3;
      const nowActive = newStatus == 1;
      const policyReactivated = wasInactive && nowActive;

      // 🆕 DETECTAR cambio en endDate (corrección de errores de registro)
      const oldEndDate = policy.endDate
        ? DateHelper.normalizeDateForComparison(new Date(policy.endDate))
        : null;
      const newEndDate = updateData.endDate
        ? DateHelper.normalizeDateForComparison(new Date(updateData.endDate))
        : oldEndDate;
      const endDateExtended =
        oldEndDate && newEndDate && newEndDate.getTime() > oldEndDate.getTime();

      // 🔍 DEBUG: Logging de detección
      console.log(`\n🔍 ========== DEBUG updatedPolicy (ID: ${id}) ==========`);
      console.log(`   📊 Estados:`);
      console.log(
        `      - oldStatus: ${oldStatus} (${oldStatus == 1 ? 'Activa' : oldStatus == 2 ? 'Cancelada' : oldStatus == 3 ? 'Culminada' : 'Otro'})`,
      );
      console.log(
        `      - newStatus: ${newStatus} (${newStatus == 1 ? 'Activa' : newStatus == 2 ? 'Cancelada' : newStatus == 3 ? 'Culminada' : 'Otro'})`,
      );
      console.log(`   📅 Fechas:`);
      console.log(
        `      - oldEndDate: ${oldEndDate ? oldEndDate.toISOString().split('T')[0] : 'null'}`,
      );
      console.log(
        `      - newEndDate: ${newEndDate ? newEndDate.toISOString().split('T')[0] : 'null'}`,
      );
      console.log(`   🚦 Condiciones:`);
      console.log(`      - wasInactive: ${wasInactive}`);
      console.log(`      - nowActive: ${nowActive}`);
      console.log(`      - policyReactivated: ${policyReactivated}`);
      console.log(`      - endDateExtended: ${endDateExtended}`);
      console.log(
        `      - statusChangedToCancelledOrCompleted: ${statusChangedToCancelledOrCompleted}`,
      );
      console.log(`========================================\n`);

      // 🔄 NUEVO: Extraer flag de recálculo de pagos (no se persiste en BD, solo flujo de control)
      // El frontend lo envía como 'correctPreviousPayments' desde el formulario de edición
      const recalculateExistingPayments =
        (updateData as any).correctPreviousPayments === true;
      delete (updateData as any).correctPreviousPayments;

      // Validar y asignar solo las propiedades permitidas de updateData
      Object.assign(policy, updateData);

      // Si el asesor cambió, elimina/anula las comisiones del asesor anterior
      if (
        updateData.advisor_id &&
        String(updateData.advisor_id) != String(oldAdvisorId)
      ) {
        console.log(
          `🔄 Detectado cambio de asesor: ${oldAdvisorId} → ${updateData.advisor_id}`,
        );
        const deleteResult =
          await this.commissionsPaymentsService.revertCommissionsOnAdvisorChange(
            policy.id,
            oldAdvisorId,
            updateData.advisor_id,
          );

        console.log(`✅ Eliminación completada:`, deleteResult);
        console.log(
          `💰 Dinero liberado: $${deleteResult.totalDeleted} disponible para el nuevo asesor`,
        );
        console.log(`📋 Log de auditoría:`, deleteResult.auditLog.join(' | '));
      }

      // Guardar la poliza actualizada en la base de datos
      const policyUpdate: PolicyEntity =
        await this.policyRepository.save(policy);

      // � CRÍTICO: Ejecutar limpieza DESPUÉS de guardar si cambió a Cancelada/Culminada
      // Esto debe hacerse DESPUÉS del save para que validateAndCleanupPayments vea el estado actualizado
      const today = new Date();
      const normalizedEndDate = DateHelper.normalizeDateForComparison(endDate);
      const normalizedToday = DateHelper.normalizeDateForComparison(today);

      // 🔥 CASO 1: Cambio MANUAL a Cancelada/Culminada
      if (statusChangedToCancelledOrCompleted) {
        try {
          console.log(
            `🔄 [updatedPolicy] Cambio de estado detectado: ${oldStatus} → ${newStatus} (Cancelada/Culminada)`,
          );

          // Cargar póliza con relaciones necesarias (ya tiene el estado actualizado porque acabamos de guardar)
          const reloadedPolicy = await this.policyRepository.findOne({
            where: { id },
            relations: ['payments', 'renewals', 'periods'],
          });

          if (reloadedPolicy) {
            console.log(
              `🧹 Ejecutando limpieza de datos posteriores a endDate (cambio manual de estado)`,
            );
            await this.validateAndCleanupPayments(reloadedPolicy);
          }
        } catch (cleanupError) {
          console.error(
            `❌ Error al ejecutar limpieza por cambio de estado: ${cleanupError.message}`,
          );
        }
      }
      // 🔥 CASO 2: Auto-culminación por fecha
      else if (
        policyUpdate.policy_status_id != 2 &&
        normalizedEndDate <= normalizedToday
      ) {
        try {
          console.log(
            `⚠️ [updatedPolicy] Póliza ${id} debe estar CULMINADA - endDate: ${normalizedEndDate.toISOString().split('T')[0]} <= today: ${normalizedToday.toISOString().split('T')[0]}`,
          );
          console.log(
            `   Cambiando status de ${policyUpdate.policy_status_id} → 3 (Culminada)`,
          );

          // Actualizar status en BD
          await this.policyRepository.update(
            { id: policyUpdate.id },
            { policy_status_id: 3 },
          );

          // Actualizar también en el objeto local
          policyUpdate.policy_status_id = 3;

          // 🔥 Ejecutar limpieza de datos posteriores a endDate
          const reloadedPolicy = await this.policyRepository.findOne({
            where: { id },
            relations: ['payments', 'renewals', 'periods'],
          });

          if (reloadedPolicy) {
            console.log(
              `🧹 Ejecutando limpieza de datos posteriores a endDate (auto-culminación)`,
            );
            await this.validateAndCleanupPayments(reloadedPolicy);
          }
        } catch (cleanupError) {
          console.error(
            `❌ Error al ejecutar limpieza automática: ${cleanupError.message}`,
          );
        }
      }

      // 🆕 CASO 3: endDate se extendió (corrección de error de registro: startDate = endDate)
      // O REACTIVACIÓN (de Cancelada/Culminada → Activa)
      // Regenerar pagos/renovaciones/períodos faltantes
      console.log(`\n🧪 EVALUANDO CASO 3:`);
      console.log(`   endDateExtended: ${endDateExtended}`);
      console.log(`   policyReactivated: ${policyReactivated}`);
      console.log(
        `   policyUpdate.policy_status_id: ${policyUpdate.policy_status_id} (tipo: ${typeof policyUpdate.policy_status_id})`,
      );
      console.log(
        `   Condición completa: ${(endDateExtended || policyReactivated) && policyUpdate.policy_status_id == 1}\n`,
      );

      if (
        (endDateExtended || policyReactivated) &&
        policyUpdate.policy_status_id == 1
      ) {
        console.log(
          `\n🎯 ========== ENTRANDO A CASO 3: REGENERACIÓN ==========\n`,
        );
        try {
          if (endDateExtended) {
            console.log(`🔄 [updatedPolicy] endDate extendido detectado:`);
            console.log(
              `   Anterior: ${oldEndDate.toISOString().split('T')[0]}`,
            );
            console.log(`   Nuevo: ${newEndDate.toISOString().split('T')[0]}`);
          }

          if (policyReactivated) {
            console.log(`🔄 [updatedPolicy] REACTIVACIÓN detectada:`);
            console.log(
              `   Estado anterior: ${oldStatus == 2 ? 'Cancelada' : 'Culminada'}`,
            );
            console.log(
              `   Estado nuevo: Activa (${policyUpdate.policy_status_id})`,
            );
          }

          console.log(
            `   Regenerando pagos/renovaciones/períodos faltantes...`,
          );

          // 🔥 CRÍTICO: Recargar con el estado YA ACTUALIZADO (acabamos de hacer save)
          // Esto es importante porque ensureConsistency valida policy_status_id
          const reloadedPolicy = await this.policyRepository.findOne({
            where: { id },
            relations: ['payments', 'renewals', 'periods', 'paymentFrequency'],
          });

          if (!reloadedPolicy) {
            console.error(`❌ No se pudo recargar la póliza ${id}`);
            throw new Error('No se pudo recargar la póliza');
          }

          console.log(
            `   🔍 Póliza recargada - Estado actual en BD: ${reloadedPolicy.policy_status_id}`,
          );
          console.log(
            `   🔍 Pagos existentes: ${reloadedPolicy.payments?.length || 0}`,
          );
          console.log(
            `   🔍 Renovaciones existentes: ${reloadedPolicy.renewals?.length || 0}`,
          );

          // Usar ensureConsistency para generar todo lo faltante
          const result = await this.policyConsistencyHelper.ensureConsistency(
            reloadedPolicy,
            this.advanceDate.bind(this),
            this.getPaymentsPerCycle.bind(this),
            this.calculatePaymentValue.bind(this),
          );

          console.log(`✅ Consistencia restaurada:`);
          console.log(`   - Renovaciones creadas: ${result.renewalsCreated}`);
          console.log(`   - Períodos creados: ${result.periodsCreated}`);
          console.log(`   - Pagos creados: ${result.paymentsCreated}`);
        } catch (regenerationError) {
          console.error(
            `❌ Error al regenerar datos: ${regenerationError.message}`,
          );
          console.error(`   Stack:`, regenerationError.stack);
        }
      }

      // 🔄 CASO 4: Recálculo retroactivo de pagos por cambio de frecuencia de pago
      if (recalculateExistingPayments && frequencyChanged) {
        try {
          console.log(
            `\n🔄 ========== CASO 4: RECÁLCULO POR CAMBIO DE FRECUENCIA ==========`,
          );
          console.log(
            `   Frecuencia anterior: ${oldFrequencyId} → Nueva: ${policyUpdate.payment_frequency_id}`,
          );
          const recalcResult =
            await this.recalculatePaymentsForFrequencyChange(id);
          console.log(
            `✅ Recálculo completado: ${recalcResult.deletedPayments} eliminados, ${recalcResult.createdPayments} creados`,
          );
        } catch (recalcError) {
          console.error(
            `❌ Error en recálculo de pagos por frecuencia: ${recalcError.message}`,
          );
        }
      } else if (recalculateExistingPayments && !frequencyChanged) {
        console.warn(
          `⚠️ [updatedPolicy] recalculateExistingPayments=true pero la frecuencia no cambió (${oldFrequencyId}). No se recalculan los pagos.`,
        );
      }

      // �🔧 NUEVO: Ajustar fechas de pagos y renovaciones si la startDate cambió
      let dateAdjustmentResult;
      if (startDateChanged) {
        console.log(
          '🔔 Detectado cambio en startDate - Ajustando fechas de pagos y renovaciones...',
        );
        dateAdjustmentResult = await this.adjustPaymentDatesOnStartDateChange(
          id,
          startDate,
          oldStartDate,
        );
        console.log(`✅ ${dateAdjustmentResult.message}`);
        if (dateAdjustmentResult.warning) {
          console.warn(`⚠️ ${dateAdjustmentResult.warning}`);
        }
      }

      // --- NUEVO: Actualizar periodo anual (ÚLTIMO PERIODO, no año actual) ---
      // Obtener todos los periodos de la póliza para encontrar el más reciente
      const existingPeriods = await this.policyPeriodDataRepository.find({
        where: { policy_id: id },
        order: { year: 'DESC' },
      });

      // Determinar qué año actualizar:
      // 1. Si hay periodos, actualizar el ÚLTIMO (más reciente)
      // 2. Si no hay periodos, usar el año de inicio de la póliza
      let yearToUpdate: number;

      if (existingPeriods.length > 0) {
        yearToUpdate = existingPeriods[0].year; // Último periodo (más reciente)
        console.log(
          `📅 Actualizando ÚLTIMO periodo existente: ${yearToUpdate}`,
        );
      } else {
        yearToUpdate = new Date(policyUpdate.startDate).getFullYear();
        console.log(
          `📅 No hay periodos, creando periodo inicial: ${yearToUpdate}`,
        );
      }

      const updatePeriodData: PolicyPeriodDataDTO = {
        policy_id: id,
        year: yearToUpdate,
        policyValue: policyUpdate.policyValue,
        agencyPercentage: policyUpdate.agencyPercentage,
        advisorPercentage: policyUpdate.advisorPercentage,
        policyFee: policyUpdate.policyFee,
      };
      await this.createOrUpdatePeriodForPolicy(
        id,
        yearToUpdate,
        updatePeriodData,
      );

      // 🔥 CRÍTICO: Validar y crear períodos faltantes
      try {
        console.log(
          `📅 [updatedPolicy] Validando períodos faltantes para póliza ${id}`,
        );
        const periodValidation = await this.validateAndCreateMissingPeriods(id);

        if (periodValidation.created > 0) {
          console.log(
            `✅ [updatedPolicy] ${periodValidation.created} períodos creados`,
          );
        }
        if (periodValidation.deleted > 0) {
          console.log(
            `🗑️ [updatedPolicy] ${periodValidation.deleted} períodos extras eliminados`,
          );
        }
      } catch (periodValidationError) {
        console.error(
          `❌ Error al validar períodos: ${periodValidationError.message}`,
        );
        // No lanzar el error para que la actualización continúe
      }

      await this.invalidateCaches(policy.advisor_id, id);

      // ✅ NO volver a cachear inmediatamente - dejar que la próxima consulta lo cachee con datos frescos
      // Esto evita inconsistencias cuando updatedPolicy se llama desde createRenevalAndUpdate

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Agregar información del ajuste de fechas en la respuesta si ocurrió
      if (dateAdjustmentResult) {
        (policyUpdate as any).dateAdjustment = dateAdjustmentResult;
      }

      return policyUpdate;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //10: metodo para registrar una renovacion de poliza
  public createRenevalAndUpdate = async (
    body: PolicyRenewalDTO,
  ): Promise<RenewalEntity> => {
    try {
      // 1. Buscar la póliza
      const policy = await this.findPolicyById(body.policy_id);
      // validar si la póliza existe antes de registrar la renovacion
      if (!policy) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      // 2. Validar duplicado de renovación
      const existingRenewal = await this.policyRenevalMethod.findOne({
        where: {
          policy_id: body.policy_id,
          renewalNumber: body.renewalNumber,
        },
      });
      if (existingRenewal) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: `Ya existe una renovación N°${body.renewalNumber} para esta póliza.`,
        });
      }
      const createdAt = DateHelper.normalizeDateForDB(body.createdAt);
      body.createdAt = createdAt;

      // 3. ACTUALIZAR la póliza con los nuevos valores recibidos del frontend
      const updateData: Partial<PolicyEntity> = {
        coverageAmount: body.coverageAmount,
        policyValue: body.policyValue,
        policyFee: body.policyFee,
        agencyPercentage: body.agencyPercentage,
        advisorPercentage: body.advisorPercentage,
        paymentsToAgency: body.paymentsToAgency,
        paymentsToAdvisor: body.paymentsToAdvisor,
      };

      // 🔥 NUEVO: Actualizar frecuencia de pago si se proporciona
      if (body.payment_frequency_id != undefined) {
        updateData.payment_frequency_id = body.payment_frequency_id;
        console.log(
          `🔄 Cambiando frecuencia de pago: ${policy.payment_frequency_id} → ${body.payment_frequency_id}`,
        );
      }

      // 🔥 NUEVO: Actualizar numberOfPayments si se proporciona (necesario para frecuencia personalizada)
      if (body.numberOfPayments != undefined) {
        updateData.numberOfPayments = body.numberOfPayments;
        console.log(
          `🔄 Actualizando número de pagos personalizados: ${body.numberOfPayments}`,
        );
      }

      await this.updatedPolicy(policy.id, updateData);

      // 4. Registrar la renovación
      const newRenewal = await this.policyRenevalMethod.save(body);

      // 🔥 NUEVO: Recargar póliza para obtener valores actualizados (incluyendo nueva frecuencia)
      const updatedPolicy = await this.findPolicyById(policy.id);

      // 5. Crear o actualizar el periodo anual usando los NUEVOS valores de la póliza
      const renewalYear = new Date(body.createdAt).getFullYear();
      console.log('Creando periodo de renovación: ', {
        policyId: updatedPolicy.id,
        renewalYear,
        bodyCreatedAt: body.createdAt,
        paymentFrequency: updatedPolicy.payment_frequency_id,
      });
      const renewalUpdatePeriodData: PolicyPeriodDataDTO = {
        policy_id: updatedPolicy.id,
        year: renewalYear,
        policyValue: updatedPolicy.policyValue,
        agencyPercentage: updatedPolicy.agencyPercentage,
        advisorPercentage: updatedPolicy.advisorPercentage,
        policyFee: updatedPolicy.policyFee,
      };
      await this.createOrUpdatePeriodForPolicy(
        updatedPolicy.id,
        renewalYear,
        renewalUpdatePeriodData,
      );

      // 6. Crear automáticamente el primer pago para el nuevo período
      await this.createFirstPaymentAfterRenewal(updatedPolicy, newRenewal);

      // 7. 🔥 CRÍTICO: Ejecutar helper de consistencia para generar TODOS los pagos faltantes hasta hoy
      console.log(
        `🔧 Ejecutando helper de consistencia para generar pagos faltantes hasta hoy...`,
      );

      try {
        const consistencyResult =
          await this.policyConsistencyHelper.ensureConsistency(
            updatedPolicy,
            this.advanceDate.bind(this),
            this.getPaymentsPerCycle.bind(this),
            this.calculatePaymentValue.bind(this),
          );

        console.log(`✅ Consistencia asegurada después de renovación:`, {
          policyId: updatedPolicy.id,
          renewalNumber: newRenewal.renewalNumber,
          renovacionesCreadas: consistencyResult.renewalsCreated,
          periodosCreados: consistencyResult.periodsCreated,
          pagosCreados: consistencyResult.paymentsCreated,
        });

        if (consistencyResult.paymentsCreated > 0) {
          console.log(
            `💰 Se generaron ${consistencyResult.paymentsCreated} pagos faltantes hasta hoy`,
          );
        }
      } catch (consistencyError) {
        console.error(
          `❌ Error al ejecutar helper de consistencia: ${consistencyError.message}`,
        );
        // No lanzar error para que la renovación se complete
      }

      // Invalidar cachés específicos y globales
      await this.invalidateCaches(policy.advisor_id, policy.id);

      // ✅ INVALIDAR TODOS LOS CACHÉS DE PÓLIZAS (para que frontend vea cambios inmediatamente)
      await this.redisService.del('payments');
      await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES);
      await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES + '_optimized');
      await this.redisService.del('paymentsByStatus:general');

      // ✅ CRÍTICO: Invalidar caché de póliza individual (con renewals)
      await this.redisService.del(`policy:${policy.id}`);
      await this.redisService.del(`policy:${policy.id}:renewals`);

      // Pequeña pausa para asegurar que la invalidación se complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      console.log(
        `✅ Renovación completada - Póliza: ${policy.id}, Renovación: ${newRenewal.renewalNumber}`,
      );
      return newRenewal;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //11: Método para crear SOLO el primer pago después de una renovación
  private async createFirstPaymentAfterRenewal(
    policy: PolicyEntity,
    renewal: RenewalEntity,
  ): Promise<void> {
    const renewalDate = DateHelper.normalizeDateForComparison(
      new Date(renewal.createdAt),
    );

    console.log(
      `📅 Generando SOLO el primer pago de renovación para fecha ${renewalDate.toISOString().split('T')[0]}`,
    );

    // Obtener todos los pagos existentes de la póliza
    const existingPolicy = await this.findPolicyById(policy.id);
    const existingPayments = existingPolicy.payments || [];

    // Encontrar el número más alto de pago existente
    const maxPaymentNumber =
      existingPayments.length > 0
        ? Math.max(...existingPayments.map((p) => p.number_payment))
        : 0;

    // Calcular valores según la frecuencia
    const policyValue = Number(policy.policyValue);
    const paymentFrequency = Number(policy.payment_frequency_id);
    const valueToPay = this.calculatePaymentValue(
      policyValue,
      paymentFrequency,
      policy.numberOfPayments,
    );
    const paymentsPerCycle = this.getPaymentsPerCycle(
      paymentFrequency,
      policy.numberOfPayments,
    );

    // 🔥 CAMBIO CRÍTICO: Solo crear el PRIMER pago de renovación
    // Los pagos adicionales se generarán manualmente con el botón "REGISTRAR PAGO ADELANTADO"
    const nextPaymentNumber = maxPaymentNumber + 1;

    // Calcular pending_value para el primer pago
    // Si es el único pago del ciclo, pending_value = 0
    const pendingValue = paymentsPerCycle == 1 ? 0 : policyValue - valueToPay;

    const newPayment: PaymentDTO = {
      policy_id: policy.id,
      number_payment: nextPaymentNumber,
      value: valueToPay,
      pending_value: pendingValue > 0 ? pendingValue : 0,
      status_payment_id: 1, // 1: Pendiente
      credit: 0,
      balance: valueToPay,
      total: 0,
      observations: `Pago generado por renovación N° ${renewal.renewalNumber}`,
      createdAt: DateHelper.normalizeDateForComparison(new Date(renewalDate)),
    };

    console.log(
      `  ✓ Creando pago #${nextPaymentNumber} para fecha ${renewalDate.toISOString().split('T')[0]} - Valor: $${valueToPay}`,
    );
    await this.paymentService.createPayment(newPayment);

    console.log(
      `✅ 1 pago generado para renovación N° ${renewal.renewalNumber}`,
    );
  }

  /**
   * Valida y limpia/genera pagos según el estado de la póliza
   * - Cancelada/Culminada: Elimina pagos pendientes posteriores a endDate
   * - Activa: Genera pagos faltantes hasta hoy si endDate es futuro
   */
  public async validateAndCleanupPayments(policy: PolicyEntity): Promise<void> {
    console.log(
      `🚀 [validateAndCleanupPayments] INICIANDO para póliza ${policy.id}`,
    );
    const today = new Date();
    const endDate = DateHelper.normalizeDateForComparison(
      new Date(policy.endDate),
    );
    console.log(
      `   Hoy: ${today.toISOString().split('T')[0]}, endDate: ${endDate.toISOString().split('T')[0]}`,
    );

    console.log(
      `🔍 Validando pagos de póliza ${policy.id} - Estado: ${policy.policy_status_id}`,
    );
    console.log(`   Fecha de fin: ${endDate.toISOString().split('T')[0]}`);

    // CASO 1: Póliza Cancelada (2) o Culminada (3) - Eliminar pagos, renovaciones y períodos posteriores
    if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
      console.log(
        `⚠️ Póliza cancelada/culminada - Limpiando datos posteriores a ${endDate.toISOString().split('T')[0]}`,
      );

      let deletedPayments = 0;
      let deletedRenewals = 0;
      let deletedPeriods = 0;

      // 1️⃣ Eliminar pagos POSTERIORES a endDate (estrictamente >), sin importar su estado
      // Los pagos del MISMO DÍA que endDate se CONSERVAN (ej: pago generado y póliza cancelada el mismo día)
      const paymentsToDelete = await this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.policy_id = :policyId', { policyId: policy.id })
        .andWhere('payment.createdAt > :endDate', { endDate })
        .getMany();

      if (paymentsToDelete.length > 0) {
        console.log(
          `🗑️ Eliminando ${paymentsToDelete.length} pagos posteriores a fecha de fin (conservando pagos del mismo día)`,
        );

        for (const payment of paymentsToDelete) {
          await this.paymentRepository.remove(payment);
          deletedPayments++;
          console.log(
            `  ✓ Eliminado pago #${payment.number_payment} (${new Date(payment.createdAt).toISOString().split('T')[0]})`,
          );
        }
      } else {
        console.log(`✅ No hay pagos posteriores a fecha de fin`);
      }

      // 2️⃣ Eliminar renovaciones >= endDate (posteriores o iguales)
      const renewalsToDelete = await this.policyRenevalMethod
        .createQueryBuilder('renewal')
        .where('renewal.policy_id = :policyId', { policyId: policy.id })
        .andWhere('renewal.createdAt >= :endDate', { endDate })
        .getMany();

      if (renewalsToDelete.length > 0) {
        console.log(
          `🗑️ Eliminando ${renewalsToDelete.length} renovaciones >= fecha de fin`,
        );

        for (const renewal of renewalsToDelete) {
          await this.policyRenevalMethod.remove(renewal);
          deletedRenewals++;
          console.log(
            `  ✓ Eliminada renovación #${renewal.renewalNumber} (${new Date(renewal.createdAt).toISOString().split('T')[0]})`,
          );
        }
      } else {
        console.log(`✅ No hay renovaciones >= fecha de fin`);
      }

      // 3️⃣ Eliminar períodos según lógica de aniversario
      const startDate = DateHelper.normalizeDateForComparison(
        new Date(policy.startDate),
      );
      const endYear = endDate.getFullYear();

      // Verificar si endDate es antes del aniversario en su año
      const anniversaryInEndYear = new Date(startDate);
      anniversaryInEndYear.setFullYear(endYear);
      const isBeforeAnniversary = endDate < anniversaryInEndYear;

      // Si endDate es antes del aniversario, eliminar también el período de ese año
      const yearThreshold = isBeforeAnniversary ? endYear : endYear + 1;

      console.log(
        `   Aniversario en año ${endYear}: ${anniversaryInEndYear.toISOString().split('T')[0]}`,
      );
      console.log(
        `   ¿EndDate antes del aniversario? ${isBeforeAnniversary ? 'Sí' : 'No'} → Eliminar períodos >= ${yearThreshold}`,
      );

      const periodsToDelete = await this.policyPeriodDataRepository
        .createQueryBuilder('period')
        .where('period.policy_id = :policyId', { policyId: policy.id })
        .andWhere('period.year >= :yearThreshold', { yearThreshold })
        .getMany();

      if (periodsToDelete.length > 0) {
        console.log(
          `🗑️ Eliminando ${periodsToDelete.length} períodos >= año ${yearThreshold}`,
        );

        for (const period of periodsToDelete) {
          await this.policyPeriodDataRepository.remove(period);
          deletedPeriods++;
          console.log(`  ✓ Eliminado período ${period.year}`);
        }
      } else {
        console.log(`✅ No hay períodos >= año ${yearThreshold}`);
      }

      console.log(`✅ [validateAndCleanupPayments] CASO 1 completado:`);
      console.log(`   - Pagos eliminados: ${deletedPayments}`);
      console.log(`   - Renovaciones eliminadas: ${deletedRenewals}`);
      console.log(`   - Períodos eliminados: ${deletedPeriods}`);
      return;
    }

    // CASO 2: Póliza Activa (1) - Asegurar consistencia completa
    console.log(`🔍 Evaluando CASO 2...`);
    if (policy.policy_status_id == 1 && endDate > today) {
      console.log(
        `📅 Póliza activa - Asegurando consistencia completa (renovaciones + períodos + pagos)`,
      );

      // Usar el helper para asegurar consistencia
      const result = await this.policyConsistencyHelper.ensureConsistency(
        policy,
        this.advanceDate.bind(this),
        this.getPaymentsPerCycle.bind(this),
        this.calculatePaymentValue.bind(this),
      );

      // Si se crearon renovaciones, períodos o pagos, invalidar caché
      if (
        result.renewalsCreated > 0 ||
        result.periodsCreated > 0 ||
        result.paymentsCreated > 0
      ) {
        console.log(`🔄 Invalidando caché debido a cambios en la póliza`);
        await this.invalidateCaches(policy.advisor_id, policy.id);
      }

      console.log(
        `✅ Consistencia asegurada - Renovaciones: ${result.renewalsCreated}, Períodos: ${result.periodsCreated}, Pagos: ${result.paymentsCreated}`,
      );
    } else {
      console.log(
        `⚠️ CASO 2 no se ejecutó - Estado: ${policy.policy_status_id}, endDate > today: ${endDate > today}`,
      );
    }

    console.log(`✅ [validateAndCleanupPayments] FINALIZADO`);
  }

  // 12: MÉTODO OBSOLETO - Reemplazado por PolicyConsistencyHelper.ensureConsistency
  // Se mantiene comentado para referencia histórica, pero NO se debe usar
  // El helper de consistencia hace lo mismo pero de forma más robusta y completa
  /*
  private async generateMissingPaymentsBeforeRenewal(policy: PolicyEntity, startDate: Date, endDate: Date): Promise<void> {
    // ⚠️ OBSOLETO: Usar PolicyConsistencyHelper.ensureConsistency en su lugar
    // Este método fue reemplazado porque:
    // 1. El helper maneja renovaciones + períodos + pagos de forma atómica
    // 2. Respeta mejor los ciclos anuales de la póliza
    // 3. Evita duplicados y maneja frecuencias personalizadas correctamente
  }
  */

  //13: Método auxiliar para recalcular valores de pagos cuando cambia el valor de la póliza en un año específico
  private async recalculatePaymentsForYear(
    policy_id: number,
    year: number,
    newPolicyValue: number,
  ): Promise<{ updatedPayments: number; message: string }> {
    try {
      console.log(
        `🔄 Recalculando pagos para año/periodo ${year} con nuevo valor $${newPolicyValue}`,
      );

      // 1. Obtener la póliza con frecuencia de pago
      const policy = await this.findPolicyById(policy_id);
      if (!policy) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: `Póliza ${policy_id} no encontrada`,
        });
      }

      const paymentFrequency = Number(policy.payment_frequency_id);

      // 2. Calcular el nuevo valor por pago según la frecuencia
      const newValuePerPayment = this.calculatePaymentValue(
        newPolicyValue,
        paymentFrequency,
        policy.numberOfPayments,
      );

      console.log(
        `💰 Nuevo valor por pago: $${newValuePerPayment} (frecuencia: ${paymentFrequency})`,
      );

      // 3. Calcular el PERIODO ANUAL basado en la fecha de inicio de la póliza
      const policyStartDate = new Date(policy.startDate);
      const policyStartYear = policyStartDate.getFullYear();
      const yearsDifference = year - policyStartYear;

      // Fecha de inicio del periodo: startDate + yearsDifference años
      const periodStartDate = new Date(policy.startDate);
      periodStartDate.setFullYear(policyStartYear + yearsDifference);

      // Fecha de fin del periodo: 1 día antes del siguiente aniversario
      const periodEndDate = new Date(periodStartDate);
      periodEndDate.setFullYear(periodEndDate.getFullYear() + 1);
      periodEndDate.setDate(periodEndDate.getDate() - 1);
      periodEndDate.setHours(23, 59, 59, 999);

      console.log(
        `📅 Periodo anual ${year}: ${periodStartDate.toISOString().split('T')[0]} → ${periodEndDate.toISOString().split('T')[0]}`,
      );

      // 4. Obtener todos los pagos del periodo especificado usando TypeORM
      const paymentsOfYear = await this.paymentRepository.find({
        where: {
          policy_id: policy_id,
        },
        order: {
          number_payment: 'ASC',
        },
      });

      // Filtrar pagos dentro del rango de fechas
      const filteredPayments = paymentsOfYear.filter((payment) => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= periodStartDate && paymentDate <= periodEndDate;
      });

      if (filteredPayments.length === 0) {
        console.log(`⚠️ No se encontraron pagos para el periodo anual ${year}`);
        return {
          updatedPayments: 0,
          message: `No hay pagos para recalcular en el periodo anual ${year}`,
        };
      }

      console.log(
        `📋 Encontrados ${filteredPayments.length} pagos para recalcular en el periodo`,
      );

      // 5. Recalcular valores y pending_value para cada pago
      let updatedCount = 0;
      let accumulatedValue = 0;

      for (const payment of filteredPayments) {
        const oldValue = Number(payment.value);
        const oldPending = Number(payment.pending_value);
        const oldBalance = Number(payment.balance || 0);

        // Actualizar el valor del pago
        payment.value = newValuePerPayment;
        accumulatedValue += newValuePerPayment;

        // Recalcular pending_value: valor total - acumulado hasta este pago
        const newPendingValue = newPolicyValue - accumulatedValue;
        payment.pending_value = newPendingValue > 0 ? newPendingValue : 0;

        // Recalcular balance considerando abonos previos
        const credit = Number(payment.credit || 0);
        const total = Number(payment.total || 0);
        const newBalance = newValuePerPayment - credit - total;

        // Solo actualizar balance si el pago NO está completamente pagado
        if (payment.status_payment_id === 2) {
          payment.balance = 0;
        } else {
          payment.balance = newBalance > 0 ? newBalance : 0;
        }

        await this.paymentRepository.save(payment);
        updatedCount++;

        console.log(
          `  ✓ Pago #${payment.number_payment}: Valor: $${oldValue} → $${newValuePerPayment} | Balance: $${oldBalance} → $${payment.balance} | Pendiente: $${oldPending} → $${payment.pending_value}`,
        );
      }

      console.log(
        `✅ ${updatedCount} pagos recalculados exitosamente para periodo anual ${year}`,
      );

      return {
        updatedPayments: updatedCount,
        message: `${updatedCount} pagos actualizados con nuevo valor $${newPolicyValue}`,
      };
    } catch (error) {
      console.error(
        `❌ Error al recalcular pagos para año ${year}:`,
        error.message,
      );
      throw ErrorManager.createSignatureError(
        `Error al recalcular pagos: ${error.message}`,
      );
    }
  }

  //14: Método para crear/actualizar  periodos para actualizar valores y % de comisiones para el calculo correcto de comiciones
  public async createOrUpdatePeriodForPolicy(
    policy_id: number,
    year: number,
    data: PolicyPeriodDataDTO,
  ): Promise<PolicyPeriodDataEntity> {
    try {
      // Buscar periodo existente
      let period = await this.policyPeriodDataRepository.findOne({
        where: { policy_id: policy_id, year },
      });

      let savedPeriod: PolicyPeriodDataEntity;
      let isUpdate = false;
      let oldValue: number | undefined;

      if (!period) {
        // Crear nuevo periodo
        const newPeriod = this.policyPeriodDataRepository.create({
          policy_id: data.policy_id,
          year: data.year,
          policyValue: data.policyValue,
          agencyPercentage: data.agencyPercentage,
          advisorPercentage: data.advisorPercentage,
          policyFee: data.policyFee,
        });
        savedPeriod = await this.policyPeriodDataRepository.save(newPeriod);
      } else {
        // Actualizar datos del periodo existente
        isUpdate = true;
        oldValue = Number(period.policyValue);
        const newValue = Number(data.policyValue);

        period.policyValue = data.policyValue;
        period.agencyPercentage = data.agencyPercentage;

        period.advisorPercentage = data.advisorPercentage;
        period.policyFee = data.policyFee;
        savedPeriod = await this.policyPeriodDataRepository.save(period);

        // 🔧 NUEVO: Si el valor de la póliza cambió, recalcular pagos de ese año
        if (oldValue !== newValue) {
          console.log(
            `📊 Detectado cambio en valor de póliza para año ${year}: $${oldValue} → $${newValue}`,
          );
          await this.recalculatePaymentsForYear(policy_id, year, newValue);
        }
      }

      const advisorId = await this.getAdvisorIdByPolicyId(policy_id);

      // ✅ INVALIDAR TODOS LOS CACHÉS RELACIONADOS (método mejorado incluye todo)
      await this.invalidateCaches(advisorId, policy_id);

      // ✅ PEQUEÑA PAUSA PARA ASEGURAR PROPAGACIÓN
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log(
        `✅ Período actualizado y cachés invalidados - Póliza: ${policy_id}, Año: ${year}, Advisor: ${advisorId}`,
      );
      return savedPeriod;
    } catch (error) {
      console.error(
        'Error al actualizar período o invalidar caché:',
        error.message,
      );
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  //15: Método para validar y crear períodos faltantes - LÓGICA HÍBRIDA
  // 🔥 Basado en ANIVERSARIOS TRANSCURRIDOS + RENOVACIONES REGISTRADAS
  // CON TRANSACCIÓN EXPLÍCITA para garantizar atomicidad
  private async validateAndCreateMissingPeriods(policy_id: number): Promise<{
    created: number;
    missingPeriods: number[];
    deleted: number;
    extraPeriods: number[];
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener la póliza (incluyendo advisor_id y renovaciones para cache)
      const policy = await queryRunner.manager.findOne(PolicyEntity, {
        where: { id: policy_id },
        relations: ['renewals'],
        select: [
          'id',
          'startDate',
          'endDate',
          'policyValue',
          'agencyPercentage',
          'advisorPercentage',
          'policyFee',
          'advisor_id',
        ],
      });

      if (!policy) {
        await queryRunner.rollbackTransaction();
        return { created: 0, missingPeriods: [], deleted: 0, extraPeriods: [] };
      }

      // 2. ENFOQUE 1: Calcular períodos por ANIVERSARIOS TRANSCURRIDOS hasta hoy
      const normalizedStart = new Date(policy.startDate);
      const today = new Date();

      const monthsDiff =
        (today.getFullYear() - normalizedStart.getFullYear()) * 12 +
        (today.getMonth() - normalizedStart.getMonth());
      const dayDiff = today.getDate() - normalizedStart.getDate();

      const adjustedMonths = dayDiff < 0 ? monthsDiff - 1 : monthsDiff;
      const periodsElapsedByAnniversary = Math.floor(adjustedMonths / 12);

      // 3. ENFOQUE 2: Calcular períodos por RENOVACIONES QUE YA OCURRIERON
      // Solo contar renovaciones con createdAt <= hoy
      const completedRenewals =
        policy.renewals?.filter((r) => {
          const renewalDate = new Date(r.createdAt);
          return renewalDate <= today;
        }) || [];
      const completedRenewalsCount = completedRenewals.length;
      const periodsExpectedByRenewals = 1 + completedRenewalsCount;

      // 4. 🔥 HÍBRIDA: Tomar el MÁXIMO de ambos enfoques
      // Si el aniversario transcurrió, debe existir período aunque no haya renovación
      // Si hay renovaciones futuras, deben tener períodos aunque aún no se cumpla aniversario
      const maxPeriodsExpected = Math.max(
        periodsElapsedByAnniversary + 1, // +1 porque periodsElapsed 0 = 1 período
        periodsExpectedByRenewals,
      );

      console.log(`📊 Póliza ${policy_id}:`);
      console.log(
        `   - Por aniversarios: ${periodsElapsedByAnniversary + 1} períodos (hasta hoy)`,
      );
      console.log(
        `   - Por renovaciones COMPLETADAS: ${periodsExpectedByRenewals} períodos (${completedRenewalsCount} renovaciones ocurridas)`,
      );
      console.log(`   - Máximo esperado: ${maxPeriodsExpected} períodos`);

      // 5. Construir lista de años esperados basándose en el máximo
      const expectedPeriods: number[] = [];
      for (let i = 0; i < maxPeriodsExpected; i++) {
        expectedPeriods.push(normalizedStart.getFullYear() + i);
      }

      console.log(`📅 Períodos esperados: [${expectedPeriods.join(', ')}]`);

      // 6. Obtener períodos existentes (dentro de la transacción)
      const existingPeriods = await queryRunner.manager.find(
        PolicyPeriodDataEntity,
        {
          where: { policy_id: policy_id },
          select: ['year'],
        },
      );

      const existingPeriodYears = existingPeriods.map((p) => p.year);
      console.log(
        `📋 Períodos existentes: [${existingPeriodYears.join(', ')}]`,
      );

      // 7. Identificar períodos faltantes
      const missingPeriods = expectedPeriods.filter(
        (year) => !existingPeriodYears.includes(year),
      );

      // 8. 🔥 NUEVO: Identificar períodos "de más" (HUÉRFANOS sin justificación)
      // Solo eliminar años >= 2000 que superen el máximo esperado
      const maxExpectedYear = Math.max(...expectedPeriods);
      const extraPeriods = existingPeriodYears.filter(
        (year) => year >= 2000 && year > maxExpectedYear,
      );

      console.log(
        `Faltantes: [${missingPeriods.join(', ')}] | Existentes: [${existingPeriodYears.join(', ')}]`,
      );

      // 9. Crear SOLO períodos faltantes (EXCEPTO si la póliza está cancelada o culminada)
      let createdCount = 0;
      let shouldInvalidateCache = false;

      // 🔥 NO crear períodos automáticamente si la póliza está cancelada (2) o culminada (5)
      const isCancelledOrCompleted =
        policy.policy_status_id == 2 || policy.policy_status_id == 5;

      if (missingPeriods.length > 0 && !isCancelledOrCompleted) {
        console.log(
          `🔍 Póliza ${policy_id}: Detectados ${missingPeriods.length} periodos faltantes: ${missingPeriods.join(', ')}`,
        );
        shouldInvalidateCache = true;

        for (const periodYear of missingPeriods) {
          const periodData = new PolicyPeriodDataEntity();
          periodData.policy_id = policy.id;
          periodData.year = periodYear;
          periodData.policyValue = policy.policyValue;
          periodData.agencyPercentage = policy.agencyPercentage;
          periodData.advisorPercentage = policy.advisorPercentage;
          periodData.policyFee = policy.policyFee;

          await queryRunner.manager.save(periodData);
          createdCount++;
          console.log(
            `✅ Creado periodo para año ${periodYear} - Póliza ${policy_id}`,
          );
        }
      } else if (missingPeriods.length > 0 && isCancelledOrCompleted) {
        console.log(
          `⚠️ Póliza ${policy_id} está cancelada/culminada - NO se crean períodos faltantes: ${missingPeriods.join(', ')}`,
        );
      }

      // 10. 🔥 INTELIGENTE: Detectar y eliminar SOLO períodos huérfanos PASADOS
      // Un período huérfano = existe pero NO tiene renovación ocurrida que lo justifique
      // ⚠️ EXCEPCIÓN: El periodo inicial (año de startDate) NUNCA se elimina porque no tiene renovación
      let deletedCount = 0;
      const orphanPeriods: number[] = [];
      const initialPeriodYear = normalizedStart.getFullYear(); // Año del periodo inicial

      for (const periodYear of existingPeriodYears) {
        // ✅ NUNCA eliminar el periodo inicial (primer año de la póliza)
        if (periodYear === initialPeriodYear) {
          console.log(
            `ℹ️ Período ${periodYear}: Es el periodo INICIAL, se deja intacto (no requiere renovación)`,
          );
          continue;
        }

        // ❌ NUNCA eliminar años >= 2000 que sean del año actual o futuros
        if (periodYear >= today.getFullYear()) {
          console.log(
            `ℹ️ Período ${periodYear}: Es actual o futuro, se deja intacto`,
          );
          continue;
        }

        // ✅ Solo evaluar períodos pasados (year < currentYear) que NO sean el inicial
        // Verificar si hay una renovación ocurrida que justifique este período
        const hasJustifyingRenewal = completedRenewals.some((renewal) => {
          const renewalPeriodYear = this.calculatePolicyPeriodNumber(
            policy.startDate,
            renewal.createdAt,
          );
          return renewalPeriodYear === periodYear;
        });

        // Si es un período pasado SIN renovación que lo justifique, es huérfano
        if (!hasJustifyingRenewal && periodYear < today.getFullYear()) {
          orphanPeriods.push(periodYear);
        }
      }

      // Eliminar períodos huérfanos pasados
      if (orphanPeriods.length > 0) {
        console.log(
          `🗑️ Póliza ${policy_id}: Detectados ${orphanPeriods.length} periodos huérfanos (sin renovación que los justifique): ${orphanPeriods.join(', ')}`,
        );
        shouldInvalidateCache = true;

        for (const orphanYear of orphanPeriods) {
          const deleteResult = await queryRunner.manager.delete(
            PolicyPeriodDataEntity,
            {
              policy_id: policy_id,
              year: orphanYear,
            },
          );

          if (deleteResult.affected && deleteResult.affected > 0) {
            deletedCount++;
            console.log(
              `🗑️ Eliminado periodo huérfano ${orphanYear} - Póliza ${policy_id}`,
            );
          }
        }
      } else if (existingPeriodYears.length > 0) {
        console.log(
          `✅ Póliza ${policy_id}: Todos los períodos existentes están justificados`,
        );
      }

      // 11. COMMIT de la transacción
      await queryRunner.commitTransaction();
      console.log(`✅ Transacción completada para póliza ${policy_id}`);

      // 12. 🔥 CRÍTICO: Invalidar cache de esta póliza DESPUÉS del commit (si hubo cambios)
      if (shouldInvalidateCache) {
        await this.invalidateCaches(policy.advisor_id, policy_id);
      }

      return {
        created: createdCount,
        missingPeriods,
        deleted: deletedCount,
        extraPeriods: orphanPeriods,
      };
    } catch (error) {
      // ROLLBACK en caso de error
      await queryRunner.rollbackTransaction();
      console.error(
        `❌ Error al validar periodos de póliza ${policy_id}:`,
        error.message,
      );
      console.error(`   Transacción revertida - Sin cambios en BD`);
      return { created: 0, missingPeriods: [], deleted: 0, extraPeriods: [] };
    } finally {
      // Liberar el query runner
      await queryRunner.release();
    }
  }

  //16: Método para obtener el periodo anual de una póliza, con caché y validación automática
  public async getPolicyPeriods(
    policy_id: number,
  ): Promise<PolicyPeriodDataEntity[]> {
    try {
      if (!policy_id) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'El ID de póliza es obligatorio.',
        });
      }

      // ✅ VALIDAR Y CREAR PERIODOS FALTANTES ANTES DE CONSULTAR
      await this.validateAndCreateMissingPeriods(policy_id);

      const cacheKey = `policy:${policy_id}:periods`;
      const cachedPeriods = await this.redisService.get(cacheKey);
      if (cachedPeriods) {
        return JSON.parse(cachedPeriods);
      }

      const policyPeriods: PolicyPeriodDataEntity[] =
        await this.policyPeriodDataRepository.find({
          where: { policy_id: policy_id },
          order: { year: 'ASC' },
        });

      // Guardar en caché por 9 horas (32400 segundos)
      await this.redisService.set(
        cacheKey,
        JSON.stringify(policyPeriods),
        32400,
      );

      return policyPeriods;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  //17: Método para reparar periodos faltantes de TODAS las pólizas (útil para producción)
  public async repairAllMissingPeriods(): Promise<{
    totalPolicies: number;
    policiesWithMissingPeriods: number;
    totalPeriodsCreated: number;
    totalPeriodsDeleted: number;
    periodsWithMixedData: Array<{
      policyId: number;
      numberPolicy: string;
      oldPeriods: number[];
      newPeriods: number[];
    }>;
    details: Array<{
      policyId: number;
      numberPolicy: string;
      created: number;
      deleted: number;
      periodNumbers: number[];
      extraPeriods: number[];
    }>;
  }> {
    try {
      console.log('🔧 Iniciando reparación masiva de periodos...');
      console.log(
        '📌 Estrategia: Crear períodos FALTANTES + Eliminar períodos FUTUROS innecesarios',
      );

      // 1. Obtener todas las pólizas (solo datos básicos)
      const allPolicies = await this.policyRepository.find({
        select: ['id', 'numberPolicy', 'startDate', 'endDate'],
        order: { id: 'ASC' },
      });

      console.log(`📊 Total de pólizas a revisar: ${allPolicies.length}`);

      let totalPeriodsCreated = 0;
      let totalPeriodsDeleted = 0;
      let policiesWithMissingPeriods = 0;
      const details: Array<{
        policyId: number;
        numberPolicy: string;
        created: number;
        deleted: number;
        periodNumbers: number[];
        extraPeriods: number[];
      }> = [];
      const periodsWithMixedData: Array<{
        policyId: number;
        numberPolicy: string;
        oldPeriods: number[];
        newPeriods: number[];
      }> = [];

      // 2. Procesar cada póliza
      for (const policy of allPolicies) {
        // 🔍 Obtener períodos ANTES de la reparación
        const periodsBefore = await this.policyPeriodDataRepository.find({
          where: { policy_id: policy.id },
          select: ['year'],
        });
        const oldPeriodYears = periodsBefore.map((p) => p.year);

        // ✅ Crear períodos FALTANTES y eliminar períodos FUTUROS
        const result = await this.validateAndCreateMissingPeriods(policy.id);

        if (result.created > 0 || result.deleted > 0) {
          policiesWithMissingPeriods++;
          totalPeriodsCreated += result.created;
          totalPeriodsDeleted += result.deleted;

          // 🔍 Obtener períodos DESPUÉS de la reparación
          const periodsAfter = await this.policyPeriodDataRepository.find({
            where: { policy_id: policy.id },
            select: ['year'],
          });
          const newPeriodYears = periodsAfter.map((p) => p.year);

          // 📊 Detectar si hay mezcla de períodos antiguos (< 2000) y nuevos (>= 2000)
          const oldStylePeriods = newPeriodYears.filter((y) => y < 2000);
          const newStylePeriods = newPeriodYears.filter((y) => y >= 2000);

          if (oldStylePeriods.length > 0 && newStylePeriods.length > 0) {
            periodsWithMixedData.push({
              policyId: policy.id,
              numberPolicy: policy.numberPolicy,
              oldPeriods: oldStylePeriods,
              newPeriods: newStylePeriods,
            });
            console.log(
              `  ⚠️ Póliza ${policy.numberPolicy}: Mezcla de períodos antiguos ${oldStylePeriods} y nuevos ${newStylePeriods}`,
            );
          }

          details.push({
            policyId: policy.id,
            numberPolicy: policy.numberPolicy,
            created: result.created,
            deleted: result.deleted,
            periodNumbers: result.missingPeriods,
            extraPeriods: result.extraPeriods,
          });
        }

        // Pequeña pausa cada 50 pólizas para no saturar la BD
        if (
          allPolicies.indexOf(policy) % 50 === 0 &&
          allPolicies.indexOf(policy) > 0
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          console.log(
            `⏳ Procesadas ${allPolicies.indexOf(policy)}/${allPolicies.length} pólizas...`,
          );
        }
      }

      // 3. 🔥 Invalidar cachés GLOBALES al final (cada póliza ya invalidó su propia cache)
      // Esto asegura que cachés globales como "allPolicies", "payments", etc. se actualicen
      try {
        const versionKey = 'policies_cache_version';
        const newVersion = Date.now().toString();
        await this.redisService.set(versionKey, newVersion, 86400);
        await this.redisService.del('customers');
        await this.redisService.del('allAdvisors');
        console.log('✅ Cachés globales invalidados');
      } catch (cacheError) {
        console.warn(
          '⚠️ Warning: Error al invalidar cachés globales:',
          cacheError.message,
        );
      }

      const summary = {
        totalPolicies: allPolicies.length,
        policiesWithMissingPeriods,
        totalPeriodsCreated,
        totalPeriodsDeleted,
        periodsWithMixedData,
        details,
      };

      console.log('✅ Reparación completada:');
      console.log(`   - Total pólizas revisadas: ${summary.totalPolicies}`);
      console.log(
        `   - Pólizas reparadas: ${summary.policiesWithMissingPeriods}`,
      );
      console.log(`   - Períodos CREADOS: ${summary.totalPeriodsCreated}`);
      console.log(
        `   - Períodos ELIMINADOS (futuros innecesarios): ${summary.totalPeriodsDeleted}`,
      );
      console.log(
        `   - Pólizas con datos mixtos (requieren revisión): ${summary.periodsWithMixedData.length}`,
      );

      if (periodsWithMixedData.length > 0) {
        console.log(
          '\n⚠️ PÓLIZAS CON MEZCLA DE PERIODOS (revisar manualmente):',
        );
        periodsWithMixedData.forEach((p) => {
          console.log(
            `   - Póliza ${p.numberPolicy} (ID: ${p.policyId}): Antiguos ${p.oldPeriods.join(',')} | Nuevos ${p.newPeriods.join(',')}`,
          );
        });
      }

      return summary;
    } catch (error) {
      console.error('❌ Error en reparación masiva:', error.message);
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  /**
   * 16B: Método OPCIONAL para CORREGIR FECHAS ADELANTADAS en todos los pagos
   *
   * ⚠️ NOTA: La corrección automática YA ESTÁ en updatedPolicy (se ejecuta siempre)
   * Este método es SOLO para reparación masiva de datos existentes (una sola vez)
   *
   * La corrección automática funciona así:
   * 1. Cada vez que se actualiza una póliza → updatedPolicy corrige fechas
   * 2. Cada vez que se renueva → createRenevalAndUpdate llama updatedPolicy
   * 3. Resultado: Las fechas se auto-corrigen sin intervención manual
   *
   * Usar este método SOLO si:
   * - Necesitas reparar TODA la base de datos de una vez
   * - Quieres ver un reporte de cuántas pólizas tienen el problema
   * - No quieres esperar a que se actualicen naturalmente
   *
   * @returns Estadísticas de corrección masiva
   */
  public async fixAllAdvancedPaymentDates(): Promise<{
    totalPolicies: number;
    totalPaymentsCorrected: number;
    alreadyCorrectedByUpdates: number;
    details: Array<{
      policyId: number;
      numberPolicy: string;
      paymentsCorrected: number;
      corrections: Array<{
        paymentNumber: number;
        oldDate: string;
        newDate: string;
        dayDiff: number;
      }>;
    }>;
  }> {
    console.log(
      '🔧 Iniciando corrección masiva de fechas adelantadas en pagos...',
    );
    console.log(
      '⚠️  NOTA: updatedPolicy ya corrige automáticamente. Este método es OPCIONAL.',
    );
    console.log(
      '💡 TIP: Las pólizas se auto-corrigen al renovarse o actualizarse.',
    );

    try {
      // Obtener todas las pólizas con pagos y renovaciones
      const allPolicies = await this.policyRepository.find({
        relations: ['payments', 'renewals'],
        order: { id: 'ASC' },
      });

      console.log(`📊 ${allPolicies.length} pólizas a revisar`);

      let totalPaymentsCorrected = 0;
      let alreadyCorrectedByUpdates = 0;
      const details: Array<{
        policyId: number;
        numberPolicy: string;
        paymentsCorrected: number;
        corrections: Array<{
          paymentNumber: number;
          oldDate: string;
          newDate: string;
          dayDiff: number;
        }>;
      }> = [];

      for (const policy of allPolicies) {
        if (!policy.payments || policy.payments.length === 0) continue;

        const startDate = new Date(policy.startDate);
        const renewals = policy.renewals || [];

        // Determinar día de aniversario
        let anniversaryDay = startDate.getDate();
        if (renewals.length > 0) {
          const lastRenewal = renewals.reduce((latest, r) =>
            new Date(r.createdAt) > new Date(latest.createdAt) ? r : latest,
          );
          anniversaryDay = new Date(lastRenewal.createdAt).getDate();
        }

        const corrections: Array<{
          paymentNumber: number;
          oldDate: string;
          newDate: string;
          dayDiff: number;
        }> = [];

        for (const payment of policy.payments) {
          const paymentDate = new Date(payment.createdAt);
          const paymentDay = paymentDate.getDate();

          // Obtener el último día del mes del pago
          const lastDayOfMonth = new Date(
            paymentDate.getFullYear(),
            paymentDate.getMonth() + 1,
            0,
          ).getDate();

          const correctedDay = Math.min(anniversaryDay, lastDayOfMonth);
          const dayDifference = paymentDay - correctedDay;

          // Solo corregir si está adelantado más de 1 día
          if (dayDifference > 1) {
            const oldDate = new Date(paymentDate);
            paymentDate.setDate(paymentDate.getDate() - dayDifference);

            payment.createdAt =
              DateHelper.normalizeDateForComparison(paymentDate);
            await this.paymentRepository.save(payment);

            corrections.push({
              paymentNumber: payment.number_payment,
              oldDate: oldDate.toISOString().split('T')[0],
              newDate: paymentDate.toISOString().split('T')[0],
              dayDiff: dayDifference,
            });

            totalPaymentsCorrected++;
          }
        }

        if (corrections.length > 0) {
          details.push({
            policyId: policy.id,
            numberPolicy: policy.numberPolicy,
            paymentsCorrected: corrections.length,
            corrections,
          });

          console.log(
            `✅ Póliza ${policy.numberPolicy}: ${corrections.length} pagos corregidos`,
          );
        }
      }

      alreadyCorrectedByUpdates = allPolicies.length - details.length;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ CORRECCIÓN MASIVA COMPLETADA');
      console.log(`   - Pólizas revisadas: ${allPolicies.length}`);
      console.log(`   - Pólizas con correcciones: ${details.length}`);
      console.log(`   - Pólizas sin problemas: ${alreadyCorrectedByUpdates}`);
      console.log(`   - Total pagos corregidos: ${totalPaymentsCorrected}`);
      console.log('');
      console.log(
        '💡 Las correcciones futuras se harán automáticamente en updatedPolicy',
      );

      // Invalidar cachés solo si hubo correcciones
      if (totalPaymentsCorrected > 0) {
        await this.invalidateCaches();
        console.log('✅ Cachés invalidados');
      }

      return {
        totalPolicies: allPolicies.length,
        totalPaymentsCorrected,
        alreadyCorrectedByUpdates,
        details,
      };
    } catch (error) {
      console.error('❌ Error en corrección masiva de fechas:', error.message);
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  /**
   * 16.5: Método para limpiar TODAS las pólizas canceladas/culminadas con datos posteriores
   *
   * PROBLEMA: Pólizas que fueron canceladas/culminadas ANTES de que existiera la limpieza automática
   * tienen pagos, renovaciones y períodos posteriores a su endDate que no deberían existir.
   *
   * Este método:
   * 1. Busca todas las pólizas con estado Cancelada (2) o Culminada (3)
   * 2. Ejecuta validateAndCleanupPayments en cada una
   * 3. Retorna estadísticas de limpieza
   *
   * ⚠️ USAR UNA SOLA VEZ para reparar datos históricos
   */
  public async cleanupAllCancelledPolicies(): Promise<{
    totalPolicies: number;
    totalCleaned: number;
    totalPaymentsDeleted: number;
    totalRenewalsDeleted: number;
    totalPeriodsDeleted: number;
    details: Array<{
      policyId: number;
      numberPolicy: string;
      status: string;
      endDate: string;
      paymentsDeleted: number;
      renewalsDeleted: number;
      periodsDeleted: number;
    }>;
  }> {
    try {
      console.log(
        '🧹 Iniciando limpieza masiva de pólizas canceladas/culminadas...',
      );

      // Buscar todas las pólizas canceladas o culminadas
      const cancelledPolicies = await this.policyRepository.find({
        where: [
          { policy_status_id: 2 }, // Cancelada
          { policy_status_id: 3 }, // Culminada
        ],
        relations: ['payments', 'renewals', 'periods', 'policyStatus'],
        order: { id: 'ASC' },
      });

      console.log(
        `📋 Encontradas ${cancelledPolicies.length} pólizas canceladas/culminadas`,
      );

      let totalCleaned = 0;
      let totalPaymentsDeleted = 0;
      let totalRenewalsDeleted = 0;
      let totalPeriodsDeleted = 0;
      const details = [];

      for (const policy of cancelledPolicies) {
        const endDate = DateHelper.normalizeDateForComparison(
          new Date(policy.endDate),
        );

        // Contar elementos posteriores a endDate ANTES de limpiar
        const paymentsAfterEnd =
          policy.payments?.filter((p) => new Date(p.createdAt) >= endDate)
            .length || 0;

        const renewalsAfterEnd =
          policy.renewals?.filter((r) => new Date(r.createdAt) >= endDate)
            .length || 0;

        // Para períodos, usar la lógica de aniversario
        const startDate = DateHelper.normalizeDateForComparison(
          new Date(policy.startDate),
        );
        const endYear = endDate.getFullYear();
        const anniversaryInEndYear = new Date(startDate);
        anniversaryInEndYear.setFullYear(endYear);
        const isBeforeAnniversary = endDate < anniversaryInEndYear;
        const yearThreshold = isBeforeAnniversary ? endYear : endYear + 1;

        const periodsAfterEnd =
          policy.periods?.filter((p) => p.year >= yearThreshold).length || 0;

        // Si tiene datos posteriores, limpiar
        if (
          paymentsAfterEnd > 0 ||
          renewalsAfterEnd > 0 ||
          periodsAfterEnd > 0
        ) {
          console.log(
            `🔍 Limpiando póliza ${policy.numberPolicy} (ID: ${policy.id})`,
          );
          console.log(
            `   Estado: ${policy.policyStatus?.statusName || policy.policy_status_id}`,
          );
          console.log(`   EndDate: ${endDate.toISOString().split('T')[0]}`);
          console.log(
            `   Datos a eliminar: ${paymentsAfterEnd} pagos, ${renewalsAfterEnd} renovaciones, ${periodsAfterEnd} períodos`,
          );

          await this.validateAndCleanupPayments(policy);

          totalCleaned++;
          totalPaymentsDeleted += paymentsAfterEnd;
          totalRenewalsDeleted += renewalsAfterEnd;
          totalPeriodsDeleted += periodsAfterEnd;

          details.push({
            policyId: policy.id,
            numberPolicy: policy.numberPolicy,
            status:
              policy.policyStatus?.statusName ||
              `Status ${policy.policy_status_id}`,
            endDate: endDate.toISOString().split('T')[0],
            paymentsDeleted: paymentsAfterEnd,
            renewalsDeleted: renewalsAfterEnd,
            periodsDeleted: periodsAfterEnd,
          });
        }
      }

      console.log(`✅ Limpieza masiva completada:`);
      console.log(`   - Pólizas revisadas: ${cancelledPolicies.length}`);
      console.log(`   - Pólizas limpiadas: ${totalCleaned}`);
      console.log(`   - Total pagos eliminados: ${totalPaymentsDeleted}`);
      console.log(
        `   - Total renovaciones eliminadas: ${totalRenewalsDeleted}`,
      );
      console.log(`   - Total períodos eliminados: ${totalPeriodsDeleted}`);

      return {
        totalPolicies: cancelledPolicies.length,
        totalCleaned,
        totalPaymentsDeleted,
        totalRenewalsDeleted,
        totalPeriodsDeleted,
        details,
      };
    } catch (error) {
      console.error(
        '❌ Error en limpieza masiva de pólizas canceladas:',
        error.message,
      );
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  /**
   * 17: Método para REGENERAR PAGOS Y RENOVACIONES cuando cambia la startDate de una póliza
   *
   * Escenario:
   * - Póliza registrada con startDate incorrecta (ej: 11/03/2023)
   * - Pagos/renovaciones generados desde esa fecha
   * - Usuario corrige startDate (ej: 20/03/2023)
   * - Este método ELIMINA todo y REGENERA desde cero con la nueva fecha
   *
   * Características:
   * - Elimina TODOS los pagos y renovaciones existentes
   * - Regenera desde cero respetando:
   *   * Día de la nueva startDate
   *   * Solo hasta la fecha actual (no futuros)
   *   * Frecuencia de pago original
   * - Usa transacción para garantizar atomicidad
   * - Invalida cachés relacionados
   *
   * @param policyId - ID de la póliza
   * @param newStartDate - Nueva fecha de inicio
   * @param oldStartDate - Fecha de inicio anterior (para logging)
   * @returns Resultado con pagos y renovaciones regenerados
   */
  public async adjustPaymentDatesOnStartDateChange(
    policyId: number,
    newStartDate: Date,
    oldStartDate: Date,
  ): Promise<{
    success: boolean;
    message: string;
    adjustedPayments: number;
    adjustedRenewals: number;
    delta: { months: number; days: number };
    warning?: string;
  }> {
    const queryRunner =
      this.policyRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar que la póliza existe
      const policy = await queryRunner.manager.findOne(PolicyEntity, {
        where: { id: policyId },
        relations: ['payments', 'renewals', 'paymentFrequency'],
      });

      if (!policy) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: `No se encontró la póliza con ID ${policyId}`,
        });
      }

      // 2. Normalizar fechas
      const normalizedOldStart =
        DateHelper.normalizeDateForComparison(oldStartDate);
      const normalizedNewStart =
        DateHelper.normalizeDateForComparison(newStartDate);

      console.log('==========================================');
      console.log(`🔄 REGENERANDO pagos/renovaciones - Póliza ID: ${policyId}`);
      console.log(`Fecha antigua: ${normalizedOldStart.toISOString()}`);
      console.log(`Fecha nueva: ${normalizedNewStart.toISOString()}`);
      console.log('==========================================');

      // 3. Si no hay cambio, no hacer nada
      if (normalizedOldStart.getTime() === normalizedNewStart.getTime()) {
        await queryRunner.rollbackTransaction();
        return {
          success: true,
          message: 'No hay cambios en la fecha de inicio',
          adjustedPayments: 0,
          adjustedRenewals: 0,
          delta: { months: 0, days: 0 },
        };
      }

      // 4. Contar registros antes de eliminar
      const oldPaymentsCount = policy.payments?.length || 0;
      const oldRenewalsCount = policy.renewals?.length || 0;

      console.log(
        `📊 Registros actuales: ${oldPaymentsCount} pagos, ${oldRenewalsCount} renovaciones`,
      );

      // 5. Verificar si hay pagos PAGADOS (status=2)
      const paidPayments =
        policy.payments?.filter((p) => p.status_payment_id === 2) || [];
      let warningMessage: string | undefined;

      if (paidPayments.length > 0) {
        warningMessage = `⚠️ ADVERTENCIA: Se eliminarán ${paidPayments.length} pagos que ya estaban PAGADOS. Esto puede afectar reportes históricos.`;
        console.log(warningMessage);
      }

      // 6. ELIMINAR todos los pagos, renovaciones Y PERIODOS existentes
      console.log('🗑️ Eliminando pagos, renovaciones y periodos existentes...');

      await queryRunner.manager.delete(PaymentEntity, { policy_id: policyId });
      console.log(`  ✓ ${oldPaymentsCount} pagos eliminados`);

      await queryRunner.manager.delete(RenewalEntity, { policy_id: policyId });
      console.log(`  ✓ ${oldRenewalsCount} renovaciones eliminadas`);

      // 🔥 CRÍTICO: Eliminar PERIODOS para regenerarlos correctamente
      const deletedPeriods = await queryRunner.manager.delete(
        PolicyPeriodDataEntity,
        { policy_id: policyId },
      );
      console.log(`  ✓ ${deletedPeriods.affected || 0} periodos eliminados`);

      // 7. COMMIT de la eliminación
      await queryRunner.commitTransaction();
      console.log('✅ Eliminación completada');

      // 8. REGENERAR pagos y renovaciones con la nueva fecha
      console.log('🔄 Regenerando con nueva fecha...');

      const today = new Date();
      const paymentFrequency = Number(policy.payment_frequency_id);

      // 🔥 CRÍTICO: Crear periodo inicial ANTES de generar pagos
      const initialYear = normalizedNewStart.getFullYear();
      const initialPeriodData: PolicyPeriodDataDTO = {
        policy_id: policyId,
        year: initialYear,
        policyValue: policy.policyValue,
        agencyPercentage: policy.agencyPercentage,
        advisorPercentage: policy.advisorPercentage,
        policyFee: policy.policyFee,
      };
      await this.createOrUpdatePeriodForPolicy(
        policyId,
        initialYear,
        initialPeriodData,
      );
      console.log(`  ✓ Periodo inicial creado para año ${initialYear}`);

      // Regenerar pagos iniciales (hasta hoy o primera renovación)
      await this.generatePaymentsUsingService(
        policy,
        normalizedNewStart,
        today,
        paymentFrequency,
      );

      // Regenerar renovaciones y sus pagos (solo hasta hoy) - estas crean sus propios periodos
      await this.handleRenewals(policy, normalizedNewStart, today);

      // 9. Contar nuevos registros
      const updatedPolicy = await this.findPolicyById(policyId);
      const newPaymentsCount = updatedPolicy.payments?.length || 0;
      const newRenewalsCount = updatedPolicy.renewals?.length || 0;

      console.log('==========================================');
      console.log('✅ REGENERACIÓN COMPLETADA');
      console.log(
        `Nuevos registros: ${newPaymentsCount} pagos, ${newRenewalsCount} renovaciones`,
      );
      console.log('==========================================');

      // 10. Calcular delta para el resumen
      const deltaYears =
        normalizedNewStart.getFullYear() - normalizedOldStart.getFullYear();
      const deltaMonths =
        normalizedNewStart.getMonth() - normalizedOldStart.getMonth();
      const deltaDays =
        normalizedNewStart.getDate() - normalizedOldStart.getDate();

      // 11. INVALIDAR CACHÉS
      try {
        await this.invalidateCaches(policy.advisor_id, policyId);
        await this.redisService.del(`policy:${policyId}`);
        await this.redisService.del(`policy:${policyId}:periods`);
        await this.redisService.del(`policy:${policyId}:renewals`);
        await this.redisService.del('payments');
        console.log('✓ Cachés invalidados correctamente');
      } catch (cacheError) {
        console.warn(
          '⚠️ Warning: Error al invalidar cachés:',
          cacheError.message,
        );
      }

      return {
        success: true,
        message: `Pagos y renovaciones regenerados correctamente: ${newPaymentsCount} pagos y ${newRenewalsCount} renovaciones`,
        adjustedPayments: newPaymentsCount,
        adjustedRenewals: newRenewalsCount,
        delta: { months: deltaMonths + deltaYears * 12, days: deltaDays },
        warning: warningMessage,
      };
    } catch (error) {
      // ROLLBACK en caso de error
      await queryRunner.rollbackTransaction();
      console.error('❌ ERROR: Transacción revertida', error.message);
      throw ErrorManager.createSignatureError(
        `Error al regenerar pagos y renovaciones: ${error.message}`,
      );
    } finally {
      // Liberar el query runner
      await queryRunner.release();
    }
  }

  /**
   * 18: Recalcula TODOS los pagos de una póliza desde cero con la nueva frecuencia de pago.
   *
   * Comportamiento:
   * - Elimina TODOS los pagos existentes (independientemente de su estado)
   * - Preserva renovaciones y períodos (son críticos para el sistema)
   * - Regenera pagos ciclo por ciclo: ciclo inicial + ciclos de renovación
   * - Solo genera hasta today (póliza activa) o endDate (cancelada/culminada)
   *
   * Se invoca desde updatedPolicy cuando:
   *   recalculateExistingPayments=true Y payment_frequency_id cambió
   */
  private async recalculatePaymentsForFrequencyChange(
    policyId: number,
  ): Promise<{ deletedPayments: number; createdPayments: number }> {
    try {
      // 1. Cargar la póliza con renovaciones (ya tiene la nueva frecuencia guardada en BD)
      const policy = await this.policyRepository.findOne({
        where: { id: policyId },
        relations: ['renewals'],
      });

      if (!policy) {
        throw new Error(`Póliza ${policyId} no encontrada`);
      }

      const paymentFrequency = Number(policy.payment_frequency_id);
      const policyValue = Number(policy.policyValue);
      const paymentsPerCycle = this.getPaymentsPerCycle(
        paymentFrequency,
        policy.numberOfPayments,
      );
      const valueToPay = this.calculatePaymentValue(
        policyValue,
        paymentFrequency,
        policy.numberOfPayments,
      );

      console.log(
        `🔄 [recalculatePaymentsForFrequencyChange] Iniciando para póliza ${policyId}`,
      );
      console.log(
        `   Nueva frecuencia: ${paymentFrequency} | Pagos por ciclo: ${paymentsPerCycle} | Valor por pago: $${valueToPay}`,
      );

      // 2. Eliminar TODOS los pagos existentes (sin excepción, indistintamente del estado)
      const deleteResult = await this.paymentRepository.delete({
        policy_id: policyId,
      });
      const deletedCount = deleteResult.affected || 0;
      console.log(
        `🗑️ ${deletedCount} pagos eliminados de la póliza ${policyId}`,
      );

      // 3. Determinar límite de generación
      const today = DateHelper.normalizeDateForComparison(new Date());
      const endDate = DateHelper.normalizeDateForComparison(
        new Date(policy.endDate),
      );
      const isActivePolicy = policy.policy_status_id == 1;
      const generationLimit = isActivePolicy ? today : endDate;
      const startDate = DateHelper.normalizeDateForComparison(
        new Date(policy.startDate),
      );

      console.log(
        `   Límite de generación: ${generationLimit.toISOString().split('T')[0]} (${
          isActivePolicy
            ? 'Activa → hasta hoy'
            : 'Cancelada/Culminada → hasta endDate'
        })`,
      );

      // 4. Construir lista de ciclos: ciclo inicial + un ciclo por cada renovación
      const sortedRenewals = [...(policy.renewals || [])].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      const cycles: Array<{ cycleStart: Date; cycleEnd: Date; label: string }> =
        [];

      // Ciclo inicial: startDate → startDate + 1 año
      const initialCycleEnd = new Date(startDate);
      initialCycleEnd.setFullYear(startDate.getFullYear() + 1);
      cycles.push({
        cycleStart: new Date(startDate),
        cycleEnd: initialCycleEnd,
        label: 'Ciclo inicial',
      });

      // Ciclos de renovaciones
      for (const renewal of sortedRenewals) {
        const renewalStart = DateHelper.normalizeDateForComparison(
          new Date(renewal.createdAt),
        );
        const renewalEnd = new Date(renewalStart);
        renewalEnd.setFullYear(renewalStart.getFullYear() + 1);
        cycles.push({
          cycleStart: renewalStart,
          cycleEnd: renewalEnd,
          label: `Renovación N° ${renewal.renewalNumber}`,
        });
      }

      // 5. Generar pagos ciclo por ciclo
      // ⚠️ IMPORTANTE: Se usa paymentRepository.save() directamente (NO paymentService.createPayment())
      // porque createPayment bloquea la creación en pólizas canceladas/culminadas.
      // Este recálculo es una operación administrativa explícita que debe ignorar esa restricción.
      let paymentNumber = 1;
      let totalCreated = 0;

      for (const cycle of cycles) {
        // Si el ciclo comienza después del límite, no hay nada que generar
        if (cycle.cycleStart > generationLimit) {
          console.log(
            `   ⏭️ Ciclo "${cycle.label}" ignorado: inicio ${cycle.cycleStart.toISOString().split('T')[0]} > límite ${generationLimit.toISOString().split('T')[0]}`,
          );
          break;
        }

        // Fin efectivo = mínimo entre fin del ciclo y límite de generación
        const effectiveEnd =
          cycle.cycleEnd <= generationLimit ? cycle.cycleEnd : generationLimit;

        console.log(
          `   📅 Ciclo "${cycle.label}": ${cycle.cycleStart.toISOString().split('T')[0]} → ${effectiveEnd.toISOString().split('T')[0]}`,
        );

        let currentDate = new Date(cycle.cycleStart);
        const processedDates = new Set<string>();

        for (
          let i = 0;
          i < paymentsPerCycle && currentDate < effectiveEnd;
          i++
        ) {
          const normalizedDate =
            DateHelper.normalizeDateForComparison(currentDate);
          const dateKey = normalizedDate.toISOString().split('T')[0];

          if (!processedDates.has(dateKey)) {
            processedDates.add(dateKey);

            // pending_value: último pago del ciclo = 0, resto = policyValue - valueToPay * (i+1)
            const pendingValue =
              i === paymentsPerCycle - 1
                ? 0
                : policyValue - valueToPay * (i + 1);
            const safePendingValue = Math.max(
              0,
              parseFloat(pendingValue.toFixed(2)),
            );

            // Guardar directamente en el repositorio para evitar el bloqueo de
            // createPayment en pólizas canceladas/culminadas
            await this.paymentRepository.save({
              policy_id: policyId,
              number_payment: paymentNumber,
              value: valueToPay,
              pending_value: paymentsPerCycle === 1 ? 0 : safePendingValue,
              status_payment_id: 1,
              credit: 0,
              balance: valueToPay,
              total: 0,
              observations:
                i === 0 && cycle.label === 'Ciclo inicial'
                  ? 'Pago inicial de la póliza (recalculado)'
                  : `Pago N° ${paymentNumber} - ${cycle.label} (recalculado)`,
              createdAt: normalizedDate,
            });
            paymentNumber++;
            totalCreated++;
          }

          currentDate = this.advanceDate(
            currentDate,
            paymentFrequency,
            policy,
            startDate,
            paymentsPerCycle,
          );
        }
      }

      // 🔒 RESGUARDO: Si no se generó ningún pago (ej: póliza cuya startDate = endDate o
      // condición inesperada), garantizar al menos el pago de registro inicial.
      if (totalCreated === 0) {
        console.warn(
          `⚠️ [recalculatePaymentsForFrequencyChange] No se generó ningún pago en los ciclos. Creando pago de registro obligatorio.`,
        );
        await this.paymentRepository.save({
          policy_id: policyId,
          number_payment: 1,
          value: valueToPay,
          pending_value: paymentsPerCycle === 1 ? 0 : policyValue - valueToPay,
          status_payment_id: 1,
          credit: 0,
          balance: valueToPay,
          total: 0,
          observations: 'Pago inicial de la póliza (recalculado)',
          createdAt: startDate,
        });
        totalCreated = 1;
        console.log(`✅ Pago de registro obligatorio creado con fecha ${startDate.toISOString().split('T')[0]}`);
      }

      console.log(
        `✅ [recalculatePaymentsForFrequencyChange] Completado: ${deletedCount} eliminados, ${totalCreated} creados`,
      );
      return { deletedPayments: deletedCount, createdPayments: totalCreated };
    } catch (error) {
      console.error(
        `❌ [recalculatePaymentsForFrequencyChange] Error: ${error.message}`,
      );
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  /**
   * 🔧 Método para CORREGIR FECHAS de pagos de una póliza específica
   * Elimina pagos que exceden el ciclo anual y corrige el día de los pagos
   */
  async fixPaymentDates(policyId: number) {
    try {
      console.log(
        `🔍 [fixPaymentDates] Validando consistencia de fechas de pagos para póliza ${policyId}`,
      );

      // Cargar póliza con pagos y renovaciones
      const policyWithPayments = await this.policyRepository.findOne({
        where: { id: policyId },
        relations: ['payments', 'renewals'],
      });

      if (!policyWithPayments) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró la póliza',
        });
      }

      if (
        !policyWithPayments.payments ||
        policyWithPayments.payments.length === 0
      ) {
        return {
          paymentsDeleted: 0,
          paymentsCorrected: 0,
          message: 'La póliza no tiene pagos registrados',
        };
      }

      const startDate = new Date(policyWithPayments.startDate);
      const renewals = policyWithPayments.renewals || [];
      const payments = policyWithPayments.payments;

      // 🔥 CRÍTICO: Obtener el día de aniversario de la última renovación (o startDate si no hay renovaciones)
      let anniversaryDay = startDate.getDate();

      if (renewals.length > 0) {
        const lastRenewal = renewals.reduce((latest, r) =>
          new Date(r.createdAt) > new Date(latest.createdAt) ? r : latest,
        );
        anniversaryDay = new Date(lastRenewal.createdAt).getDate();
        console.log(
          `📅 Día de aniversario (última renovación): ${anniversaryDay}`,
        );
      } else {
        console.log(`📅 Día de aniversario (fecha inicio): ${anniversaryDay}`);
      }

      let paymentsDeleted = 0;
      let paymentsCorrected = 0;
      const deletedPaymentDetails: string[] = [];
      const correctedPaymentDetails: string[] = [];

      // Para cada pago, verificar si su fecha excede el ciclo correspondiente
      for (const payment of payments) {
        const paymentDate = new Date(payment.createdAt);
        const paymentDay = paymentDate.getDate();

        // Determinar a qué ciclo pertenece el pago basándose en renovaciones
        let cycleStart = new Date(startDate);
        let cycleEnd = new Date(startDate);
        cycleEnd.setFullYear(cycleStart.getFullYear() + 1);

        // Buscar el ciclo correcto basándose en renovaciones
        const sortedRenewals = [...renewals].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        for (const renewal of sortedRenewals) {
          const renewalDate = new Date(renewal.createdAt);
          if (paymentDate >= renewalDate) {
            cycleStart = new Date(renewalDate);
            cycleEnd = new Date(renewalDate);
            cycleEnd.setFullYear(cycleStart.getFullYear() + 1);
          }
        }

        // Verificar si el pago excede el ciclo (está en o después del próximo aniversario)
        if (paymentDate >= cycleEnd) {
          console.log(
            `⚠️ Pago #${payment.number_payment} tiene fecha inconsistente:`,
          );
          console.log(
            `   Fecha del pago: ${paymentDate.toISOString().split('T')[0]}`,
          );
          console.log(
            `   Ciclo válido: ${cycleStart.toISOString().split('T')[0]} - ${cycleEnd.toISOString().split('T')[0]}`,
          );
          console.log(`   🗑️ Eliminando pago inconsistente...`);

          await this.paymentRepository.remove(payment);
          paymentsDeleted++;
          deletedPaymentDetails.push(
            `Pago #${payment.number_payment} (fecha: ${paymentDate.toISOString().split('T')[0]}, excede ciclo que termina ${cycleEnd.toISOString().split('T')[0]})`,
          );
        }
        // 🔥 NUEVO: Corregir el día si no coincide con el día de aniversario
        else if (paymentDay !== anniversaryDay) {
          // Obtener el último día del mes del pago
          const lastDayOfMonth = new Date(
            paymentDate.getFullYear(),
            paymentDate.getMonth() + 1,
            0,
          ).getDate();

          // Usar el menor entre el día original y el último día del mes
          const correctedDay = Math.min(anniversaryDay, lastDayOfMonth);

          if (paymentDay !== correctedDay) {
            const oldDate = new Date(paymentDate);
            paymentDate.setDate(correctedDay);

            console.log(
              `🔧 Corrigiendo día del pago #${payment.number_payment}:`,
            );
            console.log(`   Día esperado (aniversario): ${anniversaryDay}`);
            console.log(`   Día actual: ${paymentDay}`);
            console.log(
              `   Fecha anterior: ${oldDate.toISOString().split('T')[0]}`,
            );
            console.log(
              `   Fecha corregida: ${paymentDate.toISOString().split('T')[0]}`,
            );

            payment.createdAt = DateHelper.normalizeDateForDB(paymentDate);
            await this.paymentRepository.save(payment);
            paymentsCorrected++;
            correctedPaymentDetails.push(
              `Pago #${payment.number_payment} (${oldDate.toISOString().split('T')[0]} → ${paymentDate.toISOString().split('T')[0]})`,
            );
          }
        }
      }

      if (paymentsDeleted > 0 || paymentsCorrected > 0) {
        console.log(`✅ [fixPaymentDates] Corrección de fechas completada:`);
        if (paymentsDeleted > 0) {
          console.log(`   - Pagos eliminados: ${paymentsDeleted}`);
          deletedPaymentDetails.forEach((detail) =>
            console.log(`     • ${detail}`),
          );
        }
        if (paymentsCorrected > 0) {
          console.log(`   - Pagos corregidos: ${paymentsCorrected}`);
          correctedPaymentDetails.forEach((detail) =>
            console.log(`     • ${detail}`),
          );
        }

        // Invalidar cachés para reflejar los cambios
        await this.invalidateCaches(policyWithPayments.advisor_id, policyId);
      } else {
        console.log(
          `✅ [fixPaymentDates] No se encontraron pagos con fechas inconsistentes`,
        );
      }

      return {
        paymentsDeleted,
        paymentsCorrected,
        deletedPayments: deletedPaymentDetails,
        correctedPayments: correctedPaymentDetails,
      };
    } catch (error) {
      console.error(`❌ Error al corregir fechas de pagos: ${error.message}`);
      throw ErrorManager.createSignatureError(error.message);
    }
  }
}
