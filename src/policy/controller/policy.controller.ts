import { Body, Controller, Put, Get, Param, Post, Query, UseGuards, ParseIntPipe, Delete } from '@nestjs/common';
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


  //ENDPOINT ORIGINAL PARA OBTENER TODAS LAS POLIZAS 
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

  // ⚡ ENDPOINT OPTIMIZADO: Listar políticas SIN payments (evita memory leak)
  @Roles('ADMIN', 'BASIC','ELOPDP')
  @Get('get-all-policy-optimized')
  public async allPolicyOptimized(@Query('search') search?: string) {
    const allPolicy = await this.policyService.getAllPoliciesOptimized(search);
    if (allPolicy) {
      return {
        status: 'success',
        allPolicy,
        message: 'Lista optimizada sin payments - Use para listados generales'
      };
    }
  }

  // 📄 ENDPOINT PAGINADO: Máximo control de memoria (recomendado)
  @Roles('ADMIN', 'BASIC','ELOPDP')
  @Get('get-all-policy-paginated')
  public async allPolicyPaginated(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('search') search?: string
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    
    const result = await this.policyService.getAllPoliciesPaginated(pageNum, limitNum, search);
    if (result) {
      return {
        status: 'success',
        policies: result.policies,
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalRecords: result.total,
          limit: limitNum,
          hasNextPage: result.page < result.totalPages,
          hasPrevPage: result.page > 1
        },
        message: 'Lista paginada optimizada - RECOMENDADO para evitar memory leak'
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

  /**
   * Endpoint para ELIMINAR UNA PÓLIZA COMPLETA con todas sus dependencias
   * ⚠️ OPERACIÓN DESTRUCTIVA - Solo para administradores
   * Elimina:
   * - Commission Refunds
   * - Commissions Payments
   * - Payments (payment_record)
   * - Policy Periods
   * - Renewals
   * - Policy
   * 
   * Usa transacción para garantizar atomicidad (todo o nada)
   */
  @Roles('ADMIN')  // ⚠️ SOLO ADMIN puede eliminar pólizas completas
  @Delete('delete-policy-complete/:id')
  async deletePolicyComplete(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.policyService.deletePolicyComplete(id);
    
    return {
      status: result.success ? 'success' : 'error',
      message: result.message,
      deletedRecords: result.deletedRecords,
    };
  }

  /**
   * 🔧 Endpoint para REPARAR PERIODOS FALTANTES de TODAS las pólizas
   * ⚠️ OPERACIÓN MASIVA - Solo para administradores
   * Útil para:
   * - Corregir pólizas creadas antes de implementar el sistema de periodos
   * - Sincronizar periodos después de migraciones
   * - Reparar inconsistencias en producción
   * 
   * Proceso:
   * 1. Revisa todas las pólizas del sistema
   * 2. Detecta periodos faltantes (desde startDate hasta año actual)
   * 3. Crea los periodos con valores actuales de la póliza
   * 4. Invalida cachés para reflejar cambios
   */
  @Roles('ADMIN')  // ⚠️ SOLO ADMIN puede ejecutar reparaciones masivas
  @Post('repair-all-missing-periods')
  async repairAllMissingPeriods() {
    console.log('🔧 Iniciando reparación masiva de periodos desde endpoint...');
    const result = await this.policyService.repairAllMissingPeriods();
    
    return {
      status: 'success',
      message: 'Reparación de periodos completada exitosamente',
      summary: {
        totalPoliciesReviewed: result.totalPolicies,
        policiesWithMissingPeriods: result.policiesWithMissingPeriods,
        totalPeriodsCreated: result.totalPeriodsCreated,
      },
      details: result.details,
    };
  }
}

