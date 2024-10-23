import {
  Body,
  Controller,
  Get,
  Param,
  //Delete,
  //Get,
  //Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/decorators';
import { PaymentService } from '../services/payment.service';
import { PaymentDTO } from '../dto/payment.dto';

@Controller('payment')
@UseGuards(AuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  @Roles('ADMIN', 'BASIC')
  @Post('register-payment')
  public async registerPayment(@Body() body: PaymentDTO) {
    const newPayment = await this.paymentService.createPayment(body);
    if (newPayment) {
      return {
        status: 'success',
        newPayment,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Get('get-all-payment')
  public async allPayment() {
    const allPayments = await this.paymentService.getAllPayments();
    if (allPayments) {
      return {
        status: 'success',
        allPayments,
      };
    }
  }
  @Roles('ADMIN', 'BASIC')
  @Get('get-payment-id/:id')
  public async getPaymentId(@Param('id') id: number) {
    const paymentById = await this.paymentService.getPaymentsId(id);
    if (paymentById) {
      return {
        status: 'success',
        paymentById,
      };
    }
  }
}