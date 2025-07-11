import {
  Body,
  Controller,
  Get,
  Param,
  //Delete,
  //Get,
  //Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/decorators';
import { PaymentService } from '../services/payment.service';
import { PaymentDTO } from '../dto/payment.dto';
import { PaymentSchedulerService } from '@/helpers/registerPayment';

@Controller('payment')
@UseGuards(AuthGuard, RolesGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paymentSchedulerService: PaymentSchedulerService
  ) { }
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

  @Roles('ADMIN', 'BASIC')
  @Get('get-payment-by-status')
  public async getPaymentByStatus(@Query('companyId') companyId?: number) {
    const paymentByStatus = await this.paymentService.getPaymentsByStatus(companyId);
    if (paymentByStatus) {
      return {
        status: 'success',
        paymentByStatus,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Get('get-payment-status')
  public async getPaymentStatus() {
    const paymentStatus = await this.paymentService.getPaymentStatus();
    if (paymentStatus) {
      return {
        status: 'success',
        paymentStatus,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Put('update-payment/:id')
  public async updatePayment(
    @Param('id') id: number,
    @Body() updateData: Partial<PaymentDTO>,
  ) {
    const updatedPayment = await this.paymentService.updatePayment(
      id,
      updateData,
    );
    return {
      status: 'success',
      updatedPayment,
    };
  }
  //controlador para el registro manual de pagos
  /*
  @Roles('ADMIN', 'BASIC')
  @Post('manual-process-payments')
  async manualProcessPayments() {
    await this.paymentSchedulerService.manualProcessPayments();
    return {
      status: 'success',
      message: 'Pago manual procesado manualmente',
    };

    //return { status: 'success', message: 'Pago manual procesado manualmente' };
  }*/

  @Roles('ADMIN', 'BASIC')
  @Post('manual-process-payments')
  async manualProcessPayments() {
    try {
      const result = await this.paymentSchedulerService.manualProcessPayments();
      return {
        status: 'success',
        message: 'Pago manual procesado correctamente',
        data: result, // Incluir detalles de los pagos creados
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Error al procesar pagos manualmente',
        error: error.message,
      };
    }
  }

}
