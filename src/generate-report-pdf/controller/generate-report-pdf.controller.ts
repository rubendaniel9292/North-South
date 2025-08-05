import { Controller, Body, Res, UseGuards, Post, Logger, HttpStatus, BadRequestException } from '@nestjs/common';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { ErrorManager } from '@/helpers/error.manager';
import { Response } from 'express';
import { GenerateReportPdfService } from '../services/generate-report-pdf.service';
import { ReportFactory } from '../utils/factory-report';

@Controller('generate-report-pdf')
@UseGuards(AuthGuard, RolesGuard)
export class GenerateReportPdfController {
  private readonly logger = new Logger(GenerateReportPdfController.name);

  constructor(
    private readonly pdfService: GenerateReportPdfService,
    private readonly reportFactory: ReportFactory
  ) {}

  @Roles('ADMIN', 'BASIC')
  @Post('download')
  public async downloadPdf(
    @Body() body: { type: string; data: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const startTime = Date.now();
    this.logger.log(`POST /generate-report-pdf/download - Iniciando generación de reporte tipo: ${body?.type}`);
    
    try {
      // Validaciones de entrada
      if (!body || !body.type) {
        this.logger.warn('POST /generate-report-pdf/download - Tipo de reporte no especificado');
        throw new BadRequestException('El tipo de reporte es requerido');
      }

      if (!body.data) {
        this.logger.warn(`POST /generate-report-pdf/download - Datos no proporcionados para reporte tipo: ${body.type}`);
        throw new BadRequestException('Los datos del reporte son requeridos');
      }

      const { type, data } = body;
      
      this.logger.debug(`Generando HTML para reporte tipo: ${type}`);
      const html = this.reportFactory.generateHtml(type, data);
      
      this.logger.debug(`Generando PDF para reporte tipo: ${type}`);
      const pdfBuffer = await this.pdfService.generatePdf(html);

      const responseTime = Date.now() - startTime;
      const sizeKB = Math.round(pdfBuffer.length / 1024);
      
      const filename = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });

      this.logger.log(`POST /generate-report-pdf/download - Reporte generado exitosamente - Tipo: ${type} - Tamaño: ${sizeKB}KB - Tiempo: ${responseTime}ms`);
      
      return res.send(pdfBuffer);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`POST /generate-report-pdf/download - Error en ${responseTime}ms: ${error.message}`, error.stack);
      
      // Manejo específico de errores
      if (error instanceof BadRequestException) {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      if (error instanceof ErrorManager) {
        const errorType = this.extractErrorTypeFromMessage(error.message);
        const statusCode = this.getHttpStatusFromErrorType(errorType);
        res.status(statusCode).json({
          status: 'error',
          message: error.message.split('::')[1] || error.message,
          type: errorType,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Error genérico
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error', 
        message: 'Error interno generando el PDF',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private extractErrorTypeFromMessage(message: string): string {
    const parts = message.split('::');
    return parts.length > 1 ? parts[0] : 'INTERNAL_SERVER_ERROR';
  }

  private getHttpStatusFromErrorType(errorType: string): HttpStatus {
    switch (errorType) {
      case 'BAD_REQUEST':
        return HttpStatus.BAD_REQUEST;
      case 'REQUEST_TIMEOUT':
        return HttpStatus.REQUEST_TIMEOUT;
      case 'NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'INTERNAL_SERVER_ERROR':
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}