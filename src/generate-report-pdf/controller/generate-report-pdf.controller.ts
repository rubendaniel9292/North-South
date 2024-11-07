import { Controller, Body, Res, UseGuards, Post } from '@nestjs/common';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { Response } from 'express';
import { GenerateReportPdfService } from '../services/generate-report-pdf.service';
import { PolicyReportDto } from '../dto/policyreport.dto';

@Controller('generate-report-pdf')
@UseGuards(AuthGuard, RolesGuard)
export class GenerateReportPdfController {
  constructor(private readonly pdfService: GenerateReportPdfService) {}
  @Roles('ADMIN', 'BASIC')
  @Post('download-policy')
  public async downloadPdf(
    @Body() policy: PolicyReportDto,

    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      console.log('objeto de poliza recibido en el controlador: ', policy);
      // Plantilla HTML básica
      const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Póliza</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
        }
        h1,
h2,
h3,
th {
    font-family: 'Roboto', sans-serif;
    /* Peso 700 para negrita */
}  
        .conten-title {
         display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #5e72e4;
        border-radius: 8px;
        font-size: 15px;
        margin: 10px 0;
        color: white;
        height: 75px;
        width:100%; 
        }
        h2, span{
        margin: 0;
      }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .bg-warning { background-color: #ffc107; color: white; font-weight: bold; }
        .bg-danger { background-color: #dc3545; color: black; font-weight: bold; }
        .bg-success-subtle { background-color: #9aff33;color: black; font-weight: bold; }
        .table-header {
          font-weight: bold;
          background-color: #f9f9f9;
        }
      </style>
    </head>
    <body>
      <div class="conten-title">
        <h2>Reporte de Póliza N° ${policy.numberPolicy}</h2>
        <span>Fecha de generación: ${new Date().toLocaleDateString()}</span>
      </div>

      <!-- Tabla principal -->
      <table>
        <thead>
          <tr class="table-header">
            <th>Número de Póliza</th>
            <th>Cliente</th>
            <th>Compañía</th>
            <th>Tipo de Póliza</th>
            <th>Fecha de Inicio</th>
            <th>Fecha de Fin</th>
            <th>Método de Pago</th>
            <th>Banco (si aplica)</th>
            <th>Frecuencia de Pago</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${policy.numberPolicy}</td>
            <td>${policy.customer.firstName} ${policy.customer.surname}</td>
            <td>${policy.company.companyName}</td>
            <td>${policy.policyType.policyName}</td>
            <td>${new Date(policy.startDate).toISOString().slice(0, 10)}</td>
          <td>${new Date(policy.endDate).toISOString().slice(0, 10)}</td>
            <td>${policy.paymentMethod.methodName}</td>
            <td>
              ${
                policy.bankAccount?.bank?.bankName ||
                policy.creditCard?.bank?.bankName ||
                'NO APLICA'
              }
            </td>
            <td>${policy.paymentFrequency.frequencyName}</td>
          </tr>
        </tbody>
        <thead>
          <tr class="table-header">
            <th>Monto de Cobertura</th>
            <th>Porcentaje de la Agencia</th>
            <th>Porcentaje del Asesor</th>
            <th>Valor de la Póliza</th>
            <th>Número de Pagos</th>
            <th>Derecho de Póliza</th>
            <th>Pagos de comisiones al asesor</th>
            <th>Estado</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${policy.coverageAmount}</td>
            <td>${policy.agencyPercentage}</td>
            <td>${policy.advisorPercentage}</td>
            <td>${policy.policyValue}</td>
            <td>${policy.numberOfPayments}</td>
            <td>${policy.policyFee || 'NO APLICA'}</td>
            <td>${policy.paymentsToAdvisor}</td>
              <td class="${
                policy.policyStatus.id == '4'
                  ? 'bg-warning'
                  : policy.policyStatus.id == '3'
                    ? 'bg-danger'
                    : 'bg-success-subtle'
              }">
              ${policy.policyStatus.statusName}
          </td>
            </td>
            <td>${policy.observations || 'N/A'}</td>
          </tr>
        </tbody>
      </table>
        <!-- Historial de pagos -->
      <div class="conten-title">
        <h2>Historial de pagos</h2>
      </div>
      <table>
        <thead>
          <tr class="table-header">
            <th>Número de Pago</th>
            <th>Valor</th>
            <th>Abono</th>
            <th>Saldo</th>
            <th>Total</th>
            <th>Fecha de pago</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${policy.payments
            .map(
              (payment) => `
            <tr>
              <td>${payment.number_payment}</td>
              <td>${payment.value || '0.00'}</td>
              <td>${payment.credit || '0.00'}</td>
              <td>${payment.balance || '0.00'}</td>
              <td>${payment.total}</td>
              <td>${new Date(payment.createdAt).toISOString().slice(0, 10)}</td>
              <td>${payment.observations || 'N/A'}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
         <!-- Historial de penovaciones -->
          ${
            policy.renewals && policy.renewals.length > 0
              ? `
    <div class="conten-title">
      <h2>Historial de Renovaciones</h2>
    </div>
    <table>
      <thead>
        <tr class="table-header">
          <th>Número de Renovación</th>
          <th>Fecha de Renovación</th>
          <th>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        ${policy.renewals
          .map(
            (renewal) => `
          <tr>
            <td>${renewal.renewalNumber}</td>
            <td>${new Date(renewal.createdAt).toISOString().slice(0, 10)}</td>
            <td>${renewal.observations || 'N/A'}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  `
              : `
    <div class="conten-title">
      <h2>Historial de Renovaciones</h2>
      <span>Aún no se han registrado renovaciones</span>
    </div>
  `
          }
    </body>
  </html>
`;

      const pdfBuffer = await this.pdfService.generatePdf(html);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=poliza-${policy.numberPolicy}-test.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      return res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generando PDF:', error);
      res.status(500).send('Error generando el PDF');
    }
  }
}
