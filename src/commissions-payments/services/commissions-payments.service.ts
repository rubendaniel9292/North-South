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
            // Guardar la comisión en la base de datos
            const commissionsPayments = await this.commissonsPayments.save({
                ...body
            })
            // Guardar la comisión individual en caché
            await this.redisService.set(
                `commission:${commissionsPayments.id}`,
                JSON.stringify(commissionsPayments)
            )
            // Invalidar cualquier caché que contenga listas de comisiones
            await this.redisService.del(CacheKeys.GLOBAL_COMMISSIONS);
            // También podrías invalidar cachés relacionadas con el asesor específico
            await this.redisService.del(`advisor_commissions:${body.advisor_id}`);
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
