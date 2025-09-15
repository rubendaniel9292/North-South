import { Body, Controller, Put, Get, Param, Post, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { PolicyDTO, UpDatePolicyDTO } from '../dto/policy.dto';
import { PolicyService } from '../services/policy.service';
import { PolicyRenewalDTO } from '../dto/policy.renewal.dto';
import { PolicyPeriodDataDTO } from '../dto/policy.period.data.dto';
import { PolicyPeriodDataEntity } from '../entities/policy_period_data.entity';
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

  @Roles('ADMIN', 'BASIC','ELOPDP')
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
  @Roles('ADMIN', 'BASIC','ELOPDP')
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

  @Roles('ADMIN', 'BASIC','ELOPDP')
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
  @Roles('ADMIN', 'BASIC','ELOPDP')
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

  @Roles('ADMIN', 'BASIC','ELOPDP')
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

  @Roles('ADMIN', 'BASIC','ELOPDP')
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
    const newRenewal = await this.policyService.createRenevalAndUpdate(body);
    if (newRenewal) {
      return {
        status: 'success',
        newPolicy: newRenewal,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Post('update-policy/:id')
  public async updatepPolicy(@Body() updateData: UpDatePolicyDTO, @Param('id') id: number) {
    const policyUpdate = await this.policyService.updatedPolicy(id, updateData);
    if (policyUpdate) {
      return {
        status: 'success',
        policyUpdate
      }
    }

  }

  @Roles('ADMIN', 'BASIC','ELOPDP')
  @Get('get-all-satus-policy')
  public async allStatusPolicy() {
    const allStatusPolicy = await this.policyService.getPolicyStatus();
    if (allStatusPolicy) {
      return {
        status: 'success',
        allStatusPolicy,
      };
    }
  }

  @Roles('ADMIN', 'BASIC','ELOPDP')
  @Put('update-values-by-year/:policy_id/:year')
  async updateValuesByYear(
    @Param('policy_id', ParseIntPipe) policy_id: number,
    @Param('year', ParseIntPipe) year: number,
    @Body() updateData: PolicyPeriodDataDTO
  ) {
    const updateValuesByYear: PolicyPeriodDataEntity = await this.policyService.createOrUpdatePeriodForPolicy(policy_id, year, updateData);
    if (updateValuesByYear) {
      console.log("Periodo actualizado:", updateValuesByYear);
      return {
        status: 'success',
        updateValuesByYear,
      };
    }

  }

  // Endpoint para obtener todos los periodos de una póliza por ID
  @Roles('ADMIN', 'BASIC','ELOPDP')
  @Get(':policy_id/periods')
  async getPolicyPeriods(
    @Param('policy_id') policy_id: number,
  ) {
    const policyPeriods = await this.policyService.getPolicyPeriods(policy_id);
    if (policyPeriods) {
      return {
        status: 'success',
        policyPeriods,
      };
    }

  }
}

