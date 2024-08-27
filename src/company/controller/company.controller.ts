import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CompanyService } from '../services/company.service';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CompanyDTO } from '../dto/company.dto';

@Controller('company')
@UseGuards(AuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}
  @Roles('ADMIN', 'BASIC')
  @Post('register-company')
  public async registerCompany(@Body() body: CompanyDTO) {
    const newCompany = await this.companyService.createCompany(body);

    if (newCompany) {
      return {
        status: 'success',
        newCompany,
      };
    }
  }
}
