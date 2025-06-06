import { Injectable } from '@nestjs/common';
import { CommissionsPaymentsEntity } from '../entities/CommissionsPayments.entity';
import { PaymentMethodEntity } from '@/policy/entities/payment_method.entity';
import { AdvisorEntity } from '@/advisor/entities/advisor.entity';
import { CompanyEntity } from '@/company/entities/company.entity';
import { Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CacheKeys } from '@/constants/cache.enum';
import { CommissionsDTO } from '../dto/Commissions.dto';
import { DateHelper } from '@/helpers/date.helper';
@Injectable()
export class CommissionsPaymentsService {
    constructor(
        @InjectRepository(CommissionsPaymentsEntity)
        private readonly commissonsPayments: Repository<CommissionsPaymentsEntity>,
        private readonly redisService: RedisModuleService,
    ) {

    }
    //1: metodo para crear una nueva comision
    public async createCommissionsPayments(body: CommissionsDTO): Promise<CommissionsPaymentsEntity> {
        try {
            // 1. Normalización y limpieza de datos
            const normalizedBody = {
                ...body,
                createdAt: DateHelper.normalizeDateForDB(body.createdAt),
                policy_id: body.policy_id ? Number(body.policy_id) : null, // Convertir a null si es vacío/undefined
                company_id: body.company_id ? Number(body.company_id) : null,
            };

            // 2. Guardar la comisión
            const commissionsPayments = await this.commissonsPayments.save(normalizedBody);

            // 3. Manejo de caché (tu implementación actual está bien)
            await this.redisService.set(
                `commission:${commissionsPayments.id}`,
                JSON.stringify(commissionsPayments)
            );
            await this.redisService.del(CacheKeys.GLOBAL_COMMISSIONS);
            await this.redisService.del(`advisor:${body.advisor_id}`);
            await this.redisService.del(`advisor_commissions:${body.advisor_id}`);

            return commissionsPayments;
        } catch (error) {
            // Mejorar el manejo de errores
            if (error.message.includes('foreign key constraint')) {
                throw new Error('Error de integridad referencial: Verifica que todos los IDs relacionados existan');
            }
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
            const allCommissions = await this.commissonsPayments.find();

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
}
