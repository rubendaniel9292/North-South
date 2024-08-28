import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { PolicyDTO } from '../dto/policy.dto';
import { PolicyService } from '../services/policy.service';

@Controller('policy')
@UseGuards(AuthGuard, RolesGuard)
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}
  @Roles('ADMIN', 'BASIC')
  @Post('register-policy')
  public async registerPolicy(@Body() body: PolicyDTO) {
    const newPolicy = await this.policyService.createPolicy(body);
    if (newPolicy) {
      return {
        status: 'success',
        newPolicy,
      };
    }
  }
}
