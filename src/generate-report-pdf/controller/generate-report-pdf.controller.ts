import { Controller, Body, Res, UseGuards, Post, Logger } from '@nestjs/common';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/decorators';
import { AuthGuard } from '@/auth/guards/auth.guard';
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
    try {
      const { type, data } = body;
      const html = this.reportFactory.generateHtml(type, data);
      const pdfBuffer = await this.pdfService.generatePdf(html);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${type}-report.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      return res.send(pdfBuffer);
    } catch (error) {
      this.logger.error('Error generando PDF:', error.message);
      res.status(500).send('Error generando el PDF');
    }
  }
}