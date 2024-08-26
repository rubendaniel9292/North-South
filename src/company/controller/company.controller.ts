import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CompanyService } from '../services/company.service';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CompanyDTO } from '../dto/company.dto';

@Controller('company')
@UseGuards(AuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyCarService: CompanyService) {}
  @Roles('ADMIN', 'BASIC')
  @Post('register-company')
  public async registerCompany(@Body() body: CompanyDTO) {
    console.log('datos recibidos en el cotnrolador: ', body);
    const newCompany = await this.companyCarService.createCompany(body);
    console.log('Datos enviado al servicio: ', newCompany);

    if (newCompany) {
      return {
        status: 'success',
        newCompany,
      };
    }
  }
}
