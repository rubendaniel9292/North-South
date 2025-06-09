import { Module } from '@nestjs/common';
import { GenerateReportPdfService } from './services/generate-report-pdf.service';
import { GenerateReportPdfController } from './controller/generate-report-pdf.controller';
import { UserModule } from '@/user/user.module';
import { ReportFactory } from './utils/factory-report';

@Module({
  imports: [UserModule],
  providers: [GenerateReportPdfService, ReportFactory],
  controllers: [GenerateReportPdfController],
  exports: [GenerateReportPdfService],
})
export class GenerateReportPdfModule {}
