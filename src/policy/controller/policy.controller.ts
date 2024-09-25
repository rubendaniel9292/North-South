import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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

  @Roles('ADMIN', 'BASIC')
  @Get('get-all-policy')
  public async allPolicy() {
    const allPolicy = await this.policyService.getAllPolicies();
    if (allPolicy) {
      return {
        status: 'success',
        allPolicy,
      };
    }
  }
  @Roles('ADMIN', 'BASIC')
  @Get('get-all-policy-status')
  public async allPolicyStatus() {
    const policiesStatus = await this.policyService.getAllPoliciesStatus();
    if (policiesStatus) {
      return {
        status: 'success',
        policiesStatus,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Get('get-types')
  public async allTypesPolicy() {
    const allTypePolicy = await this.policyService.getTypesPolicies();
    if (allTypePolicy) {
      return {
        status: 'success',
        allTypePolicy,
      };
    }
  }
  @Roles('ADMIN', 'BASIC')
  @Get('get-frecuency')
  public async allFrecuency() {
    const allFrecuency = await this.policyService.getFrecuencyPolicies();
    if (allFrecuency) {
      return {
        status: 'success',
        allFrecuency,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Get('get-payment')
  public async allPayment() {
    const allPayment = await this.policyService.getPayment();
    if (allPayment) {
      return {
        status: 'success',
        allPayment,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Get('get-policy-id/:id')
  public async policyID(@Param('id') id: number) {
    const policyById = await this.policyService.findPolicyById(id);
    if (policyById) {
      return {
        status: 'success',
        policyById,
      };
    }
  }
}
