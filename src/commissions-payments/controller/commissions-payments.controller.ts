import { CommissionsPaymentsService } from './../services/commissions-payments.service';
import { CommissionsDTO } from '../dto/Commissions.dto';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
@Controller('commissions-payments')
@UseGuards(AuthGuard, RolesGuard)
export class CommissionsPaymentsController {
    constructor(
        private readonly commissionsPaymentsServices: CommissionsPaymentsService,
    ) { }

    @Roles('ADMIN', 'BASIC')
    @Post('register-commissions')
    public async createCommission(@Body() body: CommissionsDTO) {
        const newCommission =
            await this.commissionsPaymentsServices.createCommissionsPayments(body);
        if (newCommission) {
            return {
                status: 'success',
                newCommission,
            };
        }
    }

    @Roles('ADMIN', 'BASIC')
    @Post('apply-advance-distribution')
    @Post('apply-advance-distribution')
  async applyAdvanceDistribution(@Body() body: any) {
    return this.commissionsPaymentsServices.applyAdvanceDistribution(body);
  }

}
