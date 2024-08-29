import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdvisorService } from '../services/advisor.service';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { AdvisorDTO } from '../dto/advisor.dto';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';

@Controller('advisor')
@UseGuards(AuthGuard, RolesGuard)
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}
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

  @Roles('ADMIN', 'BASIC')
  @Get('get-all-advisor')
  public async allAdvisors() {
    console.log('entrando al controlador de advisor');
    const allAdvisors = await this.advisorService.getAllAdvisors();
    if (allAdvisors) {
      return {
        status: 'success',
        allAdvisors,
      };
    }
  }
}
