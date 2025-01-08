import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdvisorService } from '../services/advisor.service';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { AdvisorDTO } from '../dto/advisor.dto';
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

  @Roles('ADMIN', 'BASIC')
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

  @Roles('ADMIN', 'BASIC')
  @Get('get-advisor/:id')
  public async allAdvisor(@Param('id') id: number) {
    console.log('entrando al controlador de advisor');
    const advisorById = await this.advisorService.getAdvisorBiId(id);
    if (advisorById) {
      return {
        status: 'success',
        advisorById,
      };
    }
  }
}
