import {
  Body,
  Controller,
  Get,
  //Delete,
  //Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { CustomersService } from '../services/customers.service';
import { CustomerDTO, UpDateCustomerDTO } from '../dto/customer.dto';
import { AnonymizeCustomerDTO } from '../dto/anonymize-customer.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/decorators';

@Controller('customers')
@UseGuards(AuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customerService: CustomersService) { }

  @Roles('ADMIN', 'BASIC')
  @Post('register-customer')
  public async registerCustomer(@Body() body: CustomerDTO) {
    const newCustomer = await this.customerService.createCustomer(body);
    if (newCustomer) {
      return {
        status: 'success',
        newCustomer,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Get('get-all-customer')
  public async getCustomer(@Query('search') search?: string) {
    const allCustomer = await this.customerService.getAllCustomers(search);
    if (allCustomer) {
      return {
        status: 'success',
        allCustomer,
      };
    }
  }
  @Roles('ADMIN', 'BASIC')
  @Get('get-customer-id/:id')
  public async getCustomeId(@Param('id') id: number) {
    const customerById = await this.customerService.getCustomerById(id);
    if (customerById) {
      return {
        status: 'success',
        customerById,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Put('update-customer-id/:id')
  public async updateCustomer(@Body() updateData: UpDateCustomerDTO, @Param('id') id: number) {
    const customerUpdated = await this.customerService.updateCustomer(id,
      updateData,);
    if (customerUpdated) {
      return {
        status: 'success',
        customerUpdated,
      };
    }
  }

  // 🔒 LOPD - Verificar si un cliente puede ser anonimizado
  @Roles('ADMIN') // Solo administradores
  @Get('can-anonymize/:id')
  public async canCustomerBeAnonymized(@Param('id') id: number) {
    const analysisResult = await this.customerService.canCustomerBeAnonymized(id);
    return {
      status: 'success',
      data: analysisResult,
    };
  }

  // 🔒 LOPD - Anonimizar un cliente (cumplimiento protección de datos)
  @Roles('ADMIN') // Solo administradores pueden anonimizar
  @Patch('anonymize/:id')
  public async anonymizeCustomer(
    @Param('id') id: number,
    @Body() anonymizeData: AnonymizeCustomerDTO
  ) {
    const result = await this.customerService.anonymizeCustomer(
      id,
      anonymizeData.reason,
      anonymizeData.legalBasis,
      anonymizeData.requestNumber
    );
    
    return {
      status: 'success',
      message: 'Cliente anonimizado según normativa LOPD',
      data: result,
    };
  }

  // � LOPD - Evaluar solicitud de eliminación según Art. 15 y 18
  @Roles('ADMIN')
  @Post('evaluate-elimination-request/:id')
  public async evaluateEliminationRequest(
    @Param('id') id: number,
    @Body() body: { requestNumber?: string }
  ) {
    const evaluation = await this.customerService.evaluateEliminationRequest(
      id,
      body.requestNumber
    );
    
    return {
      status: 'success',
      message: 'Evaluación LOPD completada',
      data: evaluation,
    };
  }

  // 📅 LOPD - Consultar clientes elegibles para eliminación manual
  @Roles('ADMIN')
  @Get('elimination-eligible')
  public async getEliminationEligibleCustomers() {
    const eligibleCustomers = await this.customerService.getEliminationEligibleCustomers();
    
    return {
      status: 'success',
      message: 'Lista de clientes elegibles para eliminación manual',
      data: eligibleCustomers,
    };
  }

  // 📊 LOPD - Reporte de anonimizaciones
  @Roles('ADMIN')
  @Get('anonymization-report')
  public async getAnonymizationReport() {
    const report = await this.customerService.getAnonymizationReport();
    
    return {
      status: 'success',
      message: 'Reporte de anonimizaciones generado',
      data: report,
    };
  }
}
