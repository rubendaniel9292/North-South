import { Module } from '@nestjs/common';
import { GenerateReportPdfService } from './services/generate-report-pdf.service';
import { GenerateReportPdfController } from './controller/generate-report-pdf.controller';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [UserModule],
  providers: [GenerateReportPdfService],
  controllers: [GenerateReportPdfController],
  exports: [GenerateReportPdfService],
})
export class GenerateReportPdfModule {}
