import {
  Body,
  Controller,
  //Delete,
  //Get,
  //Param,
  Post,
  UseGuards,
  //UseGuards,
} from '@nestjs/common';
import { CustomersService } from '../services/customers.service';
import { CustomerDTO } from '../dto/customer.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/decorators';

@Controller('customers')
@UseGuards(AuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customerService: CustomersService) {}

  @Roles('ADMIN', 'BASIC')
  @Post('register')
  public async registerUser(@Body() body: CustomerDTO) {
    const newCustomer = await this.customerService.createCustomer(body);
    if (newCustomer) {
      return {
        status: 'success',
        newCustomer,
      };
    }
  }
}
