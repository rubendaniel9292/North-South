import {
  Body,
  Controller,
  Get,
  //Delete,
  //Get,
  Param,
  Post,
  Query,
  UseGuards,
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
}
