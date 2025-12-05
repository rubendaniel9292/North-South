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
import { PaymentEntity } from '../entity/payment.entity';

@Controller('payment')
@UseGuards(AuthGuard, RolesGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paymentSchedulerService: PaymentSchedulerService
  ) { }
  @Roles('ADMIN', 'BASIC', 'ELOPDP')
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

  @Roles('ADMIN', 'BASIC', 'ELOPDP')
  @Get('get-all-payment')
  public async allPayment(@Query('search') search?: string, @Query('status') status?: number, @Query('policy_id') policyId?: number) {
    // IMPLEMENTAR BÚSQUEDA ESPECÍFICA PARA EVITAR MEMORY LEAK
    let allPayments: PaymentEntity[] = [];

    if (policyId) {
      // Caso específico: pagos de una póliza particular
      allPayments = await this.paymentService.getPaymentsByPolicy(policyId);
    } else if (search) {
      // Caso específico: búsqueda por número de póliza o ID
      allPayments = await this.paymentService.searchPayments(search);
    } else if (status) {
      // Caso específico: pagos por estado específico
      allPayments = await this.paymentService.getPaymentsByStatusId(status);
    } else {
      // Por defecto: solo pagos pendientes (los más importantes)
      allPayments = await this.paymentService.getPaymentsWithPendingValue();
    }

    if (allPayments) {
      return {
        status: 'success',
        allPayments,
        totalCount: allPayments.length,
        message: status ? `Pagos con estado ${status}` : search ? `Búsqueda: ${search}` : policyId ? `Pagos de póliza ${policyId}` : 'Solo pagos pendientes (optimizado)'
      };
    }
  }

  // Nuevo endpoint para casos específicos donde SÍ necesitan todos los pagos
  @Roles('ADMIN', 'BASIC', 'ELOPDP')
  @Get('get-all-payment-full')
  public async allPaymentFull(@Query('confirm') confirm?: string) {
    if (confirm !== 'true') {
      return {
        status: 'warning',
        message: 'Este endpoint carga TODOS los pagos y puede causar problemas de memoria. Usa ?confirm=true si estás seguro.',
        alternative: 'Usa /get-all-payment con parámetros específicos: ?policy_id=X, ?search=X, ?status=X'
      };
    }

    const allPayments = await this.paymentService.getAllPayments();
    if (allPayments) {
      return {
        status: 'success',
        allPayments,
        warning: 'Endpoint completo usado - monitorear memoria'
      };
    }
  }
  @Roles('ADMIN', 'BASIC', 'ELOPDP')
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

  @Roles('ADMIN', 'BASIC', 'ELOPDP')
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

  @Roles('ADMIN', 'BASIC', 'ELOPDP')
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

  @Roles('ADMIN', 'BASIC', 'ELOPDP')
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


  @Roles('ADMIN', 'BASIC', 'ELOPDP')
  @Post('manual-process-payments')
  async manualProcessPayments(@Query('createFuture') createFuture?: string) {
    try {
      // Convertir el query parameter a boolean
      const createFuturePayments = createFuture === 'true';

      const result = await this.paymentSchedulerService.manualProcessPayments(createFuturePayments);
      return {
        status: 'success',
        message: `Pago manual procesado correctamente ${createFuturePayments ? '(incluyendo pagos futuros)' : '(solo hasta hoy)'}`,
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
