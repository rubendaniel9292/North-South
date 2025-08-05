import { Body, Controller, Get, Post, UseGuards, Logger } from '@nestjs/common';
import { CompanyService } from '../services/company.service';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CompanyDTO } from '../dto/company.dto';

@Controller('company')
@UseGuards(AuthGuard, RolesGuard)
export class CompanyController {
  private readonly logger = new Logger(CompanyController.name);

  constructor(private readonly companyService: CompanyService) { }

  @Roles('ADMIN', 'BASIC')
  @Post('register-company')
  public async registerCompany(@Body() body: CompanyDTO) {

    this.logger.log(`Solicitud de registro de compañía: ${body.companyName}`);

    const newCompany = await this.companyService.createCompany(body);

    this.logger.log(`Compañía registrada exitosamente: ${newCompany.id}`);
    return {
      status: 'success',
      message: 'Compañía registrada exitosamente',
      newCompany
    };

  }

  @Roles('ADMIN', 'BASIC')
  @Get('get-all-company')
  public async getCompanies() {

    this.logger.log('Solicitud de consulta de todas las compañías');

    const allCompanies = await this.companyService.getAllCompanies();
    this.logger.log(`Consulta exitosa: ${allCompanies.length} compañías encontradas`);
    return {
      status: 'success',
      message: `Se encontraron ${allCompanies.length} compañías`,
      allCompanies,
    
    };

  }
}
