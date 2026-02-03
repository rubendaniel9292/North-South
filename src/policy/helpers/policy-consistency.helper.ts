import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PolicyEntity } from '../entities/policy.entity';
import { RenewalEntity } from '../entities/renewal.entity';
import { PolicyPeriodDataEntity } from '../entities/policy_period_data.entity';
import { PaymentEntity } from '@/payment/entity/payment.entity';
import { PolicyRenewalDTO } from '../dto/policy.renewal.dto';
import { PaymentDTO } from '@/payment/dto/payment.dto';
import { DateHelper } from '@/helpers/date.helper';
import { PaymentService } from '@/payment/services/payment.service';

/**
 * Helper para asegurar consistencia entre fechas, renovaciones, períodos y pagos
 * Maneja escenarios de reactivación y registros con fechas pasadas
 */
@Injectable()
export class PolicyConsistencyHelper {
    constructor(
        @InjectRepository(RenewalEntity)
        private readonly renewalRepository: Repository<RenewalEntity>,

        @InjectRepository(PolicyPeriodDataEntity)
        private readonly periodRepository: Repository<PolicyPeriodDataEntity>,

        @InjectRepository(PaymentEntity)
        private readonly paymentRepository: Repository<PaymentEntity>,

        private readonly paymentService: PaymentService,
    ) { }

    /**
     * Asegura consistencia completa de una póliza
     * Crea renovaciones, períodos y pagos faltantes según fechas
     */
    async ensureConsistency(
        policy: PolicyEntity,
        advanceDateFn: (currentDate: Date, frequency: number, policy: PolicyEntity, periodStart: Date, paymentsPerCycle: number) => Date,
        getPaymentsPerCycleFn: (frequency: number, numberOfPayments: number) => number,
        calculatePaymentValueFn: (policyValue: number, frequency: number, numberOfPayments: number) => number
    ): Promise<{ renewalsCreated: number; periodsCreated: number; paymentsCreated: number }> {
        console.log(`🔧 [PolicyConsistencyHelper] Iniciando para póliza ${policy.id}`);
        console.log(`   📊 Estado de póliza: ${policy.policy_status_id} (1=Activa, 2=Cancelada, 3=Culminada)`);

        const startDate = DateHelper.normalizeDateForComparison(new Date(policy.startDate));
        const endDate = DateHelper.normalizeDateForComparison(new Date(policy.endDate));
        const today = new Date();

        const startYear = startDate.getFullYear();
        const currentYear = today.getFullYear();
        const endYear = endDate.getFullYear();

        // 🔥 CRÍTICO: No procesar pólizas canceladas (2) o culminadas (3)
        // Estas deben manejarse solo con validateAndCleanupPayments
        if (policy.policy_status_id == 2 || policy.policy_status_id == 3) {
            console.log(`⚠️ Póliza ${policy.id} está ${policy.policy_status_id == 2 ? 'CANCELADA' : 'CULMINADA'} - No se ejecuta ensureConsistency`);
            return { renewalsCreated: 0, periodsCreated: 0, paymentsCreated: 0 };
        }

        console.log(`   ✅ Póliza ACTIVA - Continuando con ensureConsistency`);

        // Verificar si ya pasó la fecha de aniversario en el año actual
        const anniversaryThisYear = new Date(startDate);
        anniversaryThisYear.setFullYear(currentYear);
        const hasPassedAnniversary = today >= anniversaryThisYear;

        // Calcular hasta qué año crear períodos/renovaciones
        // Si no ha pasado el aniversario este año, solo crear hasta el año anterior
        const effectiveEndYear = hasPassedAnniversary ? currentYear : currentYear - 1;
        const yearsElapsedUntilToday = effectiveEndYear - startYear;

        console.log(`   Período de póliza: ${startYear} → ${endYear}`);
        console.log(`   Aniversario este año: ${anniversaryThisYear.toISOString().split('T')[0]} - ¿Ya pasó? ${hasPassedAnniversary ? 'Sí' : 'No'}`);
        console.log(`   Años transcurridos hasta hoy: ${yearsElapsedUntilToday} (${startYear} → ${effectiveEndYear})`);

        let renewalsCreated = 0;
        let periodsCreated = 0;
        let paymentsCreated = 0;

        // Si es póliza de un solo año hasta hoy, no requiere renovaciones
        if (yearsElapsedUntilToday == 0) {
            console.log(`   ✅ Póliza de un solo año hasta hoy - Solo verificando período inicial`);

            // Asegurar que existe el período inicial
            const initialPeriod = await this.periodRepository.findOne({
                where: { policy_id: policy.id, year: startYear }
            });

            if (!initialPeriod) {
                await this.createPeriod(policy, startYear);
                periodsCreated++;
            }

            // Generar pagos hasta hoy o endDate (el menor)
            paymentsCreated = await this.generatePaymentsForSingleYear(
                policy,
                startDate,
                endDate,
                today,
                advanceDateFn,
                getPaymentsPerCycleFn,
                calculatePaymentValueFn
            );

            return { renewalsCreated, periodsCreated, paymentsCreated };
        }

        // 1️⃣ Crear renovaciones faltantes (solo si ya pasó el aniversario)
        renewalsCreated = await this.ensureRenewals(policy, startDate, yearsElapsedUntilToday);

        // 2️⃣ Crear períodos faltantes (solo hasta el año efectivo)
        periodsCreated = await this.ensurePeriods(policy, startYear, effectiveEndYear);

        // 3️⃣ Generar pagos faltantes por período
        paymentsCreated = await this.generatePaymentsByPeriod(
            policy,
            startDate,
            endDate,
            today,
            advanceDateFn,
            getPaymentsPerCycleFn,
            calculatePaymentValueFn
        );

        console.log(`🔧 [PolicyConsistencyHelper] FINALIZADO - Renovaciones: ${renewalsCreated}, Períodos: ${periodsCreated}, Pagos: ${paymentsCreated}`);

        return { renewalsCreated, periodsCreated, paymentsCreated };
    }

    /**
     * Asegura que existan todas las renovaciones necesarias
     */
    private async ensureRenewals(policy: PolicyEntity, startDate: Date, yearsElapsedUntilToday: number): Promise<number> {
        const existingRenewals = await this.renewalRepository.find({
            where: { policy_id: policy.id },
            order: { renewalNumber: 'ASC' }
        });

        // 🔧 CORREGIDO: renewalsNeeded = yearsElapsed, NO yearsElapsed + 1
        // Si yearsElapsed = 2 → necesitas 2 renovaciones (años 2 y 3), no 3
        const renewalsNeeded = yearsElapsedUntilToday;
        const renewalsMissing = renewalsNeeded - existingRenewals.length;

        console.log(`   Renovaciones: ${existingRenewals.length} existentes, ${renewalsNeeded} necesarias`);

        if (renewalsMissing <= 0) {
            console.log(`   ✅ Renovaciones completas`);
            return 0;
        }

        console.log(`   📝 Creando ${renewalsMissing} renovaciones faltantes`);

        let created = 0;
        for (let i = 0; i < renewalsMissing; i++) {
            const renewalNumber = existingRenewals.length + i + 1;
            const renewalYear = startDate.getFullYear() + renewalNumber;

            const renewalDate = new Date(startDate);
            renewalDate.setFullYear(renewalYear);

            const renewalData: PolicyRenewalDTO = {
                policy_id: policy.id,
                renewalNumber: renewalNumber,
                observations: `Renovación automática año/periodo N° ${renewalNumber}`,
                createdAt: DateHelper.normalizeDateForComparison(renewalDate)
            };

            await this.renewalRepository.save(renewalData);
            created++;
            console.log(`      ✓ Renovación #${renewalNumber} creada (${renewalDate.toISOString().split('T')[0]})`);
        }

        return created;
    }

    /**
     * Asegura que existan todos los períodos necesarios
     */
    private async ensurePeriods(policy: PolicyEntity, startYear: number, currentYear: number): Promise<number> {
        const existingPeriods = await this.periodRepository.find({
            where: { policy_id: policy.id },
            order: { year: 'ASC' }
        });

        // Solo crear períodos hasta el año actual, no futuros
        const periodsNeeded: number[] = [];
        for (let year = startYear; year <= currentYear; year++) {
            periodsNeeded.push(year);
        }

        const existingPeriodYears = existingPeriods.map(p => p.year);
        const periodsMissing = periodsNeeded.filter(year => !existingPeriodYears.includes(year));

        console.log(`   Períodos: ${existingPeriods.length} existentes, ${periodsNeeded.length} necesarios`);

        if (periodsMissing.length == 0) {
            console.log(`   ✅ Períodos completos`);
            return 0;
        }

        console.log(`   📅 Creando ${periodsMissing.length} períodos faltantes`);

        let created = 0;
        for (const year of periodsMissing) {
            await this.createPeriod(policy, year);
            created++;
            console.log(`      ✓ Período ${year} creado`);
        }

        return created;
    }

    /**
     * Crea un período para un año específico
     */
    private async createPeriod(policy: PolicyEntity, year: number): Promise<void> {
        const periodData = new PolicyPeriodDataEntity();
        periodData.policy_id = policy.id;
        periodData.year = year;
        periodData.policyValue = policy.policyValue;
        periodData.agencyPercentage = policy.agencyPercentage;
        periodData.advisorPercentage = policy.advisorPercentage;
        periodData.policyFee = policy.policyFee;

        await this.periodRepository.save(periodData);
    }

    /**
     * Genera pagos para póliza de un solo año
     */
    private async generatePaymentsForSingleYear(
        policy: PolicyEntity,
        startDate: Date,
        endDate: Date,
        today: Date,
        advanceDateFn: Function,
        getPaymentsPerCycleFn: Function,
        calculatePaymentValueFn: Function
    ): Promise<number> {
        const limitDate = endDate < today ? endDate : today;

        const existingPayments = await this.paymentRepository.find({
            where: { policy_id: policy.id },
            order: { number_payment: 'ASC' }
        });

        if (existingPayments.length > 0) {
            const lastPayment = existingPayments[existingPayments.length - 1];
            const lastPaymentDate = new Date(lastPayment.createdAt);

            if (lastPaymentDate >= limitDate) {
                console.log(`   ✅ Pagos completos hasta ${limitDate.toISOString().split('T')[0]}`);
                return 0;
            }
        }

        console.log(`   💰 Generando pagos hasta ${limitDate.toISOString().split('T')[0]}`);

        const paymentFrequency = Number(policy.payment_frequency_id);
        const paymentsPerCycle = getPaymentsPerCycleFn(paymentFrequency, policy.numberOfPayments);
        const policyValue = Number(policy.policyValue);
        const valueToPay = calculatePaymentValueFn(policyValue, paymentFrequency, policy.numberOfPayments);

        let currentDate: Date;
        let nextPaymentNumber: number;

        if (existingPayments.length == 0) {
            currentDate = new Date(startDate);
            nextPaymentNumber = 1;
        } else {
            const lastPayment = existingPayments[existingPayments.length - 1];
            currentDate = advanceDateFn(new Date(lastPayment.createdAt), paymentFrequency, policy, startDate, paymentsPerCycle);
            nextPaymentNumber = lastPayment.number_payment + 1;
        }

        let created = 0;
        let paymentsInPeriod = existingPayments.length;

        while (currentDate <= limitDate) {
            paymentsInPeriod++;

            const totalPaidInPeriod = valueToPay * paymentsInPeriod;
            const pendingValue = policyValue - totalPaidInPeriod;

            const observation = nextPaymentNumber == 1 ? 'Pago inicial de la póliza' : `Pago período ${startDate.getFullYear()}`;

            const newPayment: PaymentDTO = {
                policy_id: policy.id,
                number_payment: nextPaymentNumber,
                value: valueToPay,
                pending_value: pendingValue > 0 ? pendingValue : 0,
                status_payment_id: 1,
                credit: 0,
                balance: valueToPay,
                total: 0,
                observations: observation,
                createdAt: DateHelper.normalizeDateForComparison(new Date(currentDate))
            };

            await this.paymentService.createPayment(newPayment);
            created++;
            console.log(`      ✓ Pago #${nextPaymentNumber} (${currentDate.toISOString().split('T')[0]})`);

            currentDate = advanceDateFn(currentDate, paymentFrequency, policy, startDate, paymentsPerCycle);
            nextPaymentNumber++;
        }

        return created;
    }

    /**
     * Genera pagos faltantes por período
     */
    private async generatePaymentsByPeriod(
        policy: PolicyEntity,
        startDate: Date,
        endDate: Date,
        today: Date,
        advanceDateFn: Function,
        getPaymentsPerCycleFn: Function,
        calculatePaymentValueFn: Function
    ): Promise<number> {
        console.log(`   💰 Generando pagos faltantes por período`);

        const allPeriods = await this.periodRepository.find({
            where: { policy_id: policy.id },
            order: { year: 'ASC' }
        });

        const paymentFrequency = Number(policy.payment_frequency_id);

        const existingPayments = await this.paymentRepository.find({
            where: { policy_id: policy.id },
            order: { number_payment: 'ASC' }
        });

        // 🔧 CORREGIDO: Calcular nextPaymentNumber UNA SOLA VEZ al inicio
        // Evita renumeraciones dentro del loop de períodos
        const nextPaymentNumberStart = existingPayments.length > 0
            ? Math.max(...existingPayments.map(p => p.number_payment)) + 1
            : 1;

        let totalCreated = 0;
        let nextPaymentNumberGlobal = nextPaymentNumberStart;

        for (const period of allPeriods) {
            const periodYear = period.year;

            const periodStart = new Date(startDate);
            periodStart.setFullYear(periodYear);

            const periodEnd = new Date(periodStart);
            periodEnd.setFullYear(periodYear + 1);
            periodEnd.setDate(periodEnd.getDate() - 1);

            if (periodStart > today) {
                console.log(`      ⏭️ Período ${periodYear} es futuro - saltando`);
                continue;
            }

            let limitDate = periodEnd < today ? periodEnd : today;
            if (endDate < limitDate) {
                limitDate = endDate;
            }

            console.log(`      📆 Período ${periodYear}: ${periodStart.toISOString().split('T')[0]} → ${limitDate.toISOString().split('T')[0]}`);

            const periodPayments = existingPayments.filter(p => {
                const paymentDate = new Date(p.createdAt);
                return paymentDate >= periodStart && paymentDate < periodEnd;
            });

            console.log(`         Pagos existentes: ${periodPayments.length}`);

            // 🔧 CORREGIDO: Recalcular paymentsPerCycle por período (puede variar entre períodos)
            const paymentsPerCycle = getPaymentsPerCycleFn(paymentFrequency, policy.numberOfPayments);
            const policyValue = Number(period.policyValue);
            const valueToPay = calculatePaymentValueFn(policyValue, paymentFrequency, policy.numberOfPayments);

            let currentDate: Date;
            let nextPaymentNumber: number;

            if (periodPayments.length === 0) {
                currentDate = new Date(periodStart);
                nextPaymentNumber = nextPaymentNumberGlobal;  // 🔧 CORREGIDO: Usar contador global
            } else {
                const lastPeriodPayment = periodPayments[periodPayments.length - 1];
                const lastPaymentDate = new Date(lastPeriodPayment.createdAt);

                if (lastPaymentDate >= limitDate) {
                    console.log(`         ✅ Período completo`);
                    continue;
                }

                currentDate = advanceDateFn(lastPaymentDate, paymentFrequency, policy, periodStart, paymentsPerCycle);
                nextPaymentNumber = lastPeriodPayment.number_payment + 1;
            }

            let paymentsInPeriod = periodPayments.length;

            while (currentDate <= limitDate && currentDate < periodEnd) {
                paymentsInPeriod++;

                const totalPaidInPeriod = valueToPay * paymentsInPeriod;
                const pendingValue = policyValue - totalPaidInPeriod;

                let observation: string;
                if (periodYear === startDate.getFullYear()) {
                    observation = paymentsInPeriod == 1 ? 'Pago inicial de la póliza' : `Pago período ${periodYear}`;
                } else {
                    const renewalNumber = periodYear - startDate.getFullYear();
                    observation = paymentsInPeriod == 1
                        ? `Pago generado por renovación N° ${renewalNumber}`
                        : `Pago del ciclo de renovación N° ${renewalNumber}`;
                }

                const newPayment: PaymentDTO = {
                    policy_id: policy.id,
                    number_payment: nextPaymentNumber,
                    value: valueToPay,
                    pending_value: pendingValue > 0 ? pendingValue : 0,
                    status_payment_id: 1,
                    credit: 0,
                    balance: valueToPay,
                    total: 0,
                    observations: observation,
                    createdAt: DateHelper.normalizeDateForComparison(new Date(currentDate))
                };

                await this.paymentService.createPayment(newPayment);
                existingPayments.push({ ...newPayment, id: `temp_${nextPaymentNumber}` } as any);
                totalCreated++;
                nextPaymentNumberGlobal++;  // 🔧 CORREGIDO: Incrementar contador global
                console.log(`         ✓ Pago #${nextPaymentNumber} (${currentDate.toISOString().split('T')[0]})`);

                currentDate = advanceDateFn(currentDate, paymentFrequency, policy, periodStart, paymentsPerCycle);
                nextPaymentNumber++;
            }
        }

        console.log(`   ✅ ${totalCreated} pagos generados`);
        return totalCreated;
    }
}
