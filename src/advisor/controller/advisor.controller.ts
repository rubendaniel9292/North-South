import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
  @Post('register')
  public async registerUser(@Body() body: AdvisorDTO) {
    const newAdvisor = await this.advisorService.createAdvisor(body);
    if (newAdvisor) {
      return {
        status: 'success',
        newAdvisor,
      };
    }
  }
}
