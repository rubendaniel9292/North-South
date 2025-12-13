import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdvisorService } from '../services/advisor.service';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { AdvisorDTO, UpDateAdvisorDTO } from '../dto/advisor.dto';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';

@Controller('advisor')
@UseGuards(AuthGuard, RolesGuard)
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) { }
  @Roles('ADMIN', 'BASIC')
  @Post('register-advisor')
  public async registerAdvisor(@Body() body: AdvisorDTO) {
    const newAdvisor = await this.advisorService.createAdvisor(body);
    if (newAdvisor) {
      return {
        status: 'success',
        newAdvisor,
      };
    }
  }

  @Roles('ADMIN', 'BASIC', 'ELOPDP')
  @Get('get-all-advisor')
  public async allAdvisors(@Query('search') search?: string) {
    console.log('entrando al controlador de advisor');
    const allAdvisors = await this.advisorService.getAllAdvisors(search);
    if (allAdvisors) {
      return {
        status: 'success',
        allAdvisors,
      };
    }
  }

  @Roles('ADMIN', 'BASIC', 'ELOPDP')
  @Get('get-advisor/:id')
  public async allAdvisor(@Param('id') id: number) {
    console.log('entrando al controlador de advisor');
    const advisorById = await this.advisorService.getAdvisorById(id);
    if (advisorById) {
      return {
        status: 'success',
        advisorById,
      };
    }
  }
  /*
  @Roles('ADMIN', 'BASIC', 'ELOPDP')
  @Get('get-advisor-optimized-simple/:id')
  public async getAdvisorSimple(
    @Param('id') id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    console.log(`Cargando asesor ${id} (simple) - Página: ${page}, Límite: ${limit}`);
    
    const result = await this.advisorService.getAdvisorByIdOptimizedSimple(
      Number(id),
      page ? Number(page) : 1,
      limit ? Number(limit) : 10
    );

    return {
      status: 'success',
      advisorById: result.advisor,
      pagination: result.pagination,
    };
  }*/

  @Roles('ADMIN', 'BASIC', 'ELOPDP')
  @Get('get-advisor-optimized/:id')
  public async allAdvisorOptimized(
    @Param('id') id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('customerId') customerId?: number,
    @Query('policyId') policyId?: number,
    @Query('search') search?: string,
  ) {
    console.log(`Cargando asesor ${id} con filtros - Página: ${page}, Límite: ${limit}, Cliente: ${customerId}, Póliza: ${policyId}, Búsqueda: ${search}`);
    
    const result = await this.advisorService.getAdvisorByIdOptimized(
      Number(id),
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      customerId ? Number(customerId) : undefined,
      policyId ? Number(policyId) : undefined,
      search
    );

    return {
      status: 'success',
      advisorById: result.advisor,
      pagination: result.pagination,
      filters: {
        customerId: customerId ? Number(customerId) : null,
        policyId: policyId ? Number(policyId) : null,
        search: search || null,
      }
    };
  }


  @Roles('ADMIN', 'BASIC')
  @Put('update-advisor-id/:id')
  public async updateAvisor(@Body() updateData: UpDateAdvisorDTO, @Param('id') id: number) {
    const advisorUpdate = await this.advisorService.updateAvisor(id,
      updateData);
    if (advisorUpdate) {
      return {
        status: 'success',
        advisorUpdate,
      };
    }
  }
}
