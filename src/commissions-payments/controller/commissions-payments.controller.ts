import { CommissionsPaymentsService } from './../services/commissions-payments.service';
import { CommissionsDTO } from '../dto/Commissions.dto';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CommissionRefundsDTO } from '../dto/CommissionRefunds.dto';
import { CommissionRefundsEntity } from '../entities/CommissionRefunds.entity';
@Controller('commissions-payments')
@UseGuards(AuthGuard, RolesGuard)
export class CommissionsPaymentsController {
    constructor(
        private readonly commissionsPaymentsServices: CommissionsPaymentsService,
        private readonly commissionRefundsServices: CommissionsPaymentsService
    ) { }

    @Roles('ADMIN', 'BASIC','ELOPDP')
    @Post('register-commissions')
    public async createCommission(@Body() body: CommissionsDTO) {
        const newCommission = await this.commissionsPaymentsServices.createCommissionsPayments(body);
        if (newCommission) {
            return {
                status: 'success',
                newCommission,
            };
        }
    }

    @Roles('ADMIN', 'BASIC','ELOPDP')
    @Post('apply-advance-distribution')
    public async applyAdvanceDistribution(@Body() body: any) {
        return this.commissionsPaymentsServices.applyAdvanceDistribution(body);
    }

    @Roles('ADMIN', 'BASIC','ELOPDP')
    @Post('register-commission-refunds')
    public async createCommissionRefunds(@Body() body: CommissionRefundsDTO) {
        const commissionRefunds: CommissionRefundsEntity = await this.commissionRefundsServices.createCommissionRefunds(body);
        if (commissionRefunds) {
            return {
                status: 'success',
                commissionRefunds,
            };
        }
    }
}
