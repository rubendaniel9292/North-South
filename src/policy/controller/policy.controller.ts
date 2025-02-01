import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { PolicyDTO } from '../dto/policy.dto';
import { PolicyService } from '../services/policy.service';
import { PolicyRenewalDTO } from '../dto/policy.renewal.dto';

@Controller('policy')
@UseGuards(AuthGuard, RolesGuard)
export class PolicyController {
  constructor(
    private readonly policyService: PolicyService,
    //private readonly pdfService: PdfService,
  ) { }

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
  public async allPolicy(@Query('search') search?: string) {
    const allPolicy = await this.policyService.getAllPolicies(search);
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
  @Get('get-payment-method')
  public async allPaymentMetohd() {
    const allPaymentMethod = await this.policyService.getPaymentMethod();
    if (allPaymentMethod) {
      return {
        status: 'success',
        allPaymentMethod,
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
  @Roles('ADMIN', 'BASIC')
  @Post('register-renewal')
  public async createReneval(@Body() body: PolicyRenewalDTO) {
    const newRenewal = await this.policyService.createReneval(body);
    if (newRenewal) {
      return {
        status: 'success',
        newPolicy: newRenewal,
      };
    }
  }
}
