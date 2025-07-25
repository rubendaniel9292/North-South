import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CommissionsPaymentsEntity } from '../entities/CommissionsPayments.entity';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CacheKeys } from '@/constants/cache.enum';
import { ErrorManager } from '@/helpers/error.manager';
import { CommissionsDTO } from '../dto/Commissions.dto';
import { DateHelper } from '@/helpers/date.helper';
import { CommissionRefundsEntity } from '../entities/CommissionRefunds.entity';
import { CommissionRefundsDTO } from '../dto/CommissionRefunds.dto';
interface PolicyAdvanceDTO {
    policy_id: number;
    released_commission: number;
    advance_to_apply: number;
}
interface ApplyAdvanceDistributionDTO {
    advisor_id: number;
    receiptNumber: string;
    createdAt: string;
    observations?: string;
    payment_method_id: number;
    policies: PolicyAdvanceDTO[];
}
@Injectable()
export class CommissionsPaymentsService {
    constructor(
        @InjectRepository(CommissionsPaymentsEntity)
        private readonly commissionsPayments: Repository<CommissionsPaymentsEntity>,

        @InjectRepository(PolicyEntity)
        private readonly policyRepository: Repository<PolicyEntity>,

        @InjectRepository(CommissionRefundsEntity)
        private readonly commissionRefundsRepository: Repository<CommissionRefundsEntity>,

        private readonly redisService: RedisModuleService,
    ) { }

    /** 
   * Private utility: Reparto FIFO de anticipos generales entre pólizas con saldo pendiente
   */
    public async applyAdvanceDistribution(body: ApplyAdvanceDistributionDTO): Promise<any> {
        try {
            const applied: Array<{ policy_id: number; applied: number }> = [];

            // 1. Fetch all relevant policies with their commissions/payments
            const policies = await this.policyRepository.find({
                where: { id: In(body.policies.map(p => p.policy_id)) },
                relations: ['commissions', 'renewals', 'payments'] // Asegúrate que 'commissions' trae los pagos relacionados
            });

            // 2. Get all commission payments for this advisor (to compute general advances)
            const allPayments = await this.commissionsPayments.find({
                where: { advisor_id: body.advisor_id }
            });
            allPayments
                .filter(p => (p.policy_id === null || p.policy_id === undefined) && p.status_advance_id === 1)
                .forEach(p => {
                    console.log("Anticipo encontrado:", p, "advanceAmount type:", typeof p.advanceAmount, "valor:", p.advanceAmount);
                });
            // 3. Prepare policy data for general advance distribution

            const policyData = policies.map(policy => {
                let releasedCommission = 0;
                if (policy.isCommissionAnnualized) {
                    // Multiplica por el número de renovaciones + 1 (periodo inicial)
                    const numRenewals = Number(policy.renewals?.length || 0);
                    releasedCommission = Number(policy.paymentsToAdvisor) * (numRenewals + 1);
                } else {
                    releasedCommission = policy.payments
                        ? policy.payments.reduce((sum, p) =>
                            (Number(p.status_payment_id) == 2)
                                ? sum + Number(p.value || 0)
                                : sum
                            , 0)
                        : 0;
                }
                const paidCommission = policy.commissions
                    ? policy.commissions.reduce((sum, c) =>
                        c.status_advance_id === null
                            ? sum + Number(c.advanceAmount || 0)
                            : sum
                        , 0)
                    : 0;

                return {
                    id: policy.id,
                    releasedCommission,
                    paidCommission
                };
            });

            // 4. Total general advance available (status_advance_id === 1 and no policy_id)
            /*
            const totalGeneralAdvance = allPayments
                .filter(p => !p.policy_id && p.status_advance_id === 1)
                .reduce((sum, p) => sum + Number(p.advanceAmount || 0), 0);
*/
            const totalGeneralAdvance = allPayments
                .filter(p => (p.policy_id === null || p.policy_id === undefined) && Number(p.status_advance_id) === 1)
                .reduce((sum, p) => sum + Number(p.advanceAmount || 0), 0);

            console.log('totalGeneralAdvance antes:', totalGeneralAdvance);
            // 5. Distribute general advances among policies (FIFO logic)
            const advanceByPolicy = this.distributeGeneralAdvanceToPolicies(policyData, totalGeneralAdvance);
            console.log("advanceByPolicy: ", advanceByPolicy);
            console.log("totalGeneralAdvance: ", totalGeneralAdvance);
            console.log("body.policies: ", body.policies);
            console.log("applied: ", applied);
            console.log("totalGeneralAdvance: ", totalGeneralAdvance);
            console.log("body.policies: ", body.policies);
            console.log("polici data: ", policyData);
            console.log('allPayments:', allPayments);
            console.log("Payload recibido:", body.policies);
            // 6. For each policy in the request, validate and register the abono
            // 6. For each policy in the request, validate and register the abono
            for (const policyInput of body.policies) {
                console.log('Procesando policy_id:', policyInput.policy_id, 'advance_to_apply:', policyInput.advance_to_apply);
                const policy = policyData.find(p => p.id === policyInput.policy_id);
                const fromGeneralAdvance = advanceByPolicy[policyInput.policy_id] || 0;

                //const availableBalance = policy.releasedCommission - policy.paidCommission - fromGeneralAdvance;
                const availableBalance = policy.releasedCommission - policy.paidCommission;

                if (policyInput.advance_to_apply > availableBalance) {
                    throw new Error(
                        `Cannot apply $${policyInput.advance_to_apply} to policy ${policyInput.policy_id}. Released: $${policy.releasedCommission}, Already paid: $${policy.paidCommission}, Already covered by general advance: $${fromGeneralAdvance}. Try a lower amount.`
                    );
                }
                // 1. Si hay parte del anticipo general a descontar en esta póliza
                if (fromGeneralAdvance > 0) {
                    const paymentFromAdvance = this.commissionsPayments.create({
                        advisor_id: body.advisor_id,
                        policy_id: policyInput.policy_id,
                        receiptNumber: body.receiptNumber,
                        advanceAmount: fromGeneralAdvance,
                        createdAt: body.createdAt,
                        observations: `Anticipo general descontado automáticamente el ${body.createdAt}`,
                        payment_method_id: body.payment_method_id,
                        status_advance_id: null,
                    });
                    await this.commissionsPayments.save(paymentFromAdvance);
                    applied.push({
                        policy_id: policyInput.policy_id,
                        applied: fromGeneralAdvance,
                    });
                }
                // 2. Si hay monto restante a aplicar (por pago normal/manual)
                const remainingToApply = policyInput.advance_to_apply - fromGeneralAdvance;
                console.log(`[RESTANTE MANUAL] Creando registro: policy_id=${policyInput.policy_id}, amount=${remainingToApply}, receipt=${body.receiptNumber}, obs=${body.observations}`);

                // SOLO REGISTRA EL MONTO QUE LLEGA DEL FRONTEND, SIN RESTAR EL ANTICIPO GENERAL
                if (policyInput.advance_to_apply > 0) {
                    const paymentNormal = this.commissionsPayments.create({
                        advisor_id: body.advisor_id,
                        policy_id: policyInput.policy_id,
                        receiptNumber: body.receiptNumber,
                        advanceAmount: policyInput.advance_to_apply, // YA ES SOLO LA DIFERENCIA
                        createdAt: body.createdAt,
                        observations: body.observations || "",
                        payment_method_id: body.payment_method_id,
                        status_advance_id: null,
                    });
                    await this.commissionsPayments.save(paymentNormal);

                    applied.push({
                        policy_id: policyInput.policy_id,
                        applied: policyInput.advance_to_apply,
                    });
                }
            }
            // 7. If all general advances were used, mark them as liquidated
            let remainingGeneralAdvance = totalGeneralAdvance;
            for (const id of Object.keys(advanceByPolicy)) {
                remainingGeneralAdvance -= advanceByPolicy[Number(id)];
            }
            if (remainingGeneralAdvance === 0 && totalGeneralAdvance > 0) {
                const generalAdvances = allPayments.filter(p => !p.policy_id && p.status_advance_id === 1);
                const advancesIds = generalAdvances.map(a => a.id);
                await this.commissionsPayments.update(
                    { id: In(advancesIds) },
                    { status_advance_id: 2 } // 2 = Liquidated
                );
            }

            // 8. Clear cache
            await this.redisService.del(CacheKeys.GLOBAL_COMMISSIONS);
            await this.redisService.del(`advisor:${body.advisor_id}`);
            await this.redisService.del('allAdvisors');
            // 9. Liquidar anticipos generales si corresponde
            await this.liquidateAdvancesIfNeeded(body.advisor_id);
            return {
                status: 'success',
                message: 'Payments applied successfully',
                applied,
            };
        } catch (error) {
            throw ErrorManager.createSignatureError(error.message);
        }
    }

    /**
     * Private utility: Distributes general advances among policies with pending commission (FIFO)
     */
    private distributeGeneralAdvanceToPolicies(
        policies: { id: number, releasedCommission: number, paidCommission: number }[],
        generalAdvanceAmount: number
    ): Record<number, number> {
        let remainingAdvance = generalAdvanceAmount;
        const advanceApplied: Record<number, number> = {};

        // Sort by highest pending commission
        const sorted = [...policies].sort(
            (a, b) => (b.releasedCommission - b.paidCommission) - (a.releasedCommission - a.paidCommission)
        );

        for (const policy of sorted) {
            const commissionInFavor = policy.releasedCommission - policy.paidCommission;
            if (commissionInFavor > 0 && remainingAdvance > 0) {
                const amount = Math.min(commissionInFavor, remainingAdvance);
                advanceApplied[policy.id] = amount;
                remainingAdvance -= amount;
            } else {
                advanceApplied[policy.id] = 0;
            }
        }
        return advanceApplied;
    }
    //1: metodo para crear una nueva comision
    public async createCommissionsPayments(body: CommissionsDTO): Promise<CommissionsPaymentsEntity> {
        try {
            // Normalización y limpieza de datos
            let normalizedPolicyId = null;
            if (
                typeof body.policy_id === 'number' &&
                !isNaN(body.policy_id) &&
                body.policy_id > 0 // puedes ajustar esto si aceptas id 0 como válido
            ) {
                normalizedPolicyId = body.policy_id;
            } else if (
                typeof body.policy_id === 'string' &&
                String(body.policy_id).trim() !== '' &&
                !isNaN(Number(body.policy_id)) &&
                Number(body.policy_id) > 0
            ) {
                normalizedPolicyId = Number(body.policy_id);
            } // Si no cumple, sigue siendo null

            const normalizedBody = {
                ...body,
                createdAt: DateHelper.normalizeDateForDB(body.createdAt),
                company_id: body.company_id ? Number(body.company_id) : null,
                policy_id: normalizedPolicyId,
                // status_advance_id lo ponemos abajo
            };

            // Forzar status_advance_id según tipo de operación
            if (normalizedBody.policy_id === null) {
                // Anticipo general
                normalizedBody.status_advance_id = 1;
            } else {
                // Comisión pagada (siempre que tenga policy_id válido)
                normalizedBody.status_advance_id = null;
            }
            // Invalidar caché de comisiones globales
            await this.redisService.del(CacheKeys.GLOBAL_COMMISSIONS);

            // Invalidar también cualquier caché específica del asesor
            await this.redisService.del(`advisor:${normalizedBody.advisor_id}`);
            await this.redisService.del('allAdvisors');
            const commissionsPayments = await this.commissionsPayments.save(normalizedBody);

            return commissionsPayments;
        } catch (error) {
            throw ErrorManager.createSignatureError(error.message);
        }
    }
    //2: Método para obtener todas las comisiones (con caché)
    public async getAllCommissions() {
        try {
            // Intentar obtener del caché primero
            const cachedCommissions = await this.redisService.get(CacheKeys.GLOBAL_COMMISSIONS);

            if (cachedCommissions) {
                return JSON.parse(cachedCommissions);
            }

            // Si no está en caché, obtener de la base de datos
            const allCommissions: CommissionsPaymentsEntity[] = await this.commissionsPayments.find();

            // Guardar en caché para futuras consultas
            await this.redisService.set(
                CacheKeys.GLOBAL_COMMISSIONS,
                JSON.stringify(allCommissions),
                3600 // TTL de 1 hora (opcional)
            );

            return allCommissions;
        } catch (error) {
            throw ErrorManager.createSignatureError(error.message);
        }
    }

    //3: Función que liquida los anticipos si se cumple la condición
    public async liquidateAdvancesIfNeeded(advisorId: number) {
        // Sumar anticipos vigentes
        const advances = await this.commissionsPayments.find({
            where: { advisor_id: advisorId, status_advance_id: 1 }
        });
        const sumAdvances = advances.reduce((acc, curr) => acc + Number(curr.advanceAmount), 0);

        // Sumar comisiones pagadas (ajusta si tienes una columna para distinguirlos)
        const paidCommissions = await this.commissionsPayments.find({
            where: {
                advisor_id: advisorId,
                status_advance_id: null, // Solo las comisiones, no anticipos

            }
        });
        const sumPaidCommissions = paidCommissions.reduce((acc, curr) => acc + Number(curr.advanceAmount), 0);

        // Si la suma de comisiones pagadas cubre anticipos vigentes, liquida los anticipos
        if (sumPaidCommissions >= sumAdvances && sumAdvances > 0) {
            await this.commissionsPayments.update(
                { advisor_id: advisorId, status_advance_id: 1 },
                { status_advance_id: 2 }
            );
        }
    }

    //4: registro de devolucion de anticipos
    public async createCommissionRefunds(body: CommissionRefundsDTO): Promise<CommissionRefundsEntity> {
        try {
            // const createdAt = DateHelper.normalizeDateForDB(body.createdAt);
            const cancellationDate = DateHelper.normalizeDateForDB(body.cancellationDate);
            //body.createdAt = createdAt;
            body.cancellationDate = cancellationDate;
            const commissionRefunds: CommissionRefundsEntity = await this.commissionRefundsRepository.save(body);
            await this.redisService.del('allAdvisors');
            await this.redisService.del(
                CacheKeys.GLOBAL_COMMISSIONS,
            );
            await this.redisService.del(CacheKeys.GLOBAL_ALL_POLICIES);
            await this.redisService.del(CacheKeys.GLOBAL_COMMISSION_REFUNDS);
            await this.redisService.del('policies');
            await this.redisService.del(`advisor:${body.advisor_id}`);

            return commissionRefunds;
        } catch (error) {
            throw ErrorManager.createSignatureError(error.message);
        }
    }
}