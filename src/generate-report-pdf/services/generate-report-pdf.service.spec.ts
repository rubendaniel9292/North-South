import { Test, TestingModule } from '@nestjs/testing';
import { GenerateReportPdfService } from './generate-report-pdf.service';

describe('GenerateReportPdfService', () => {
  let service: GenerateReportPdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateReportPdfService],
    }).compile();

    service = module.get<GenerateReportPdfService>(GenerateReportPdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
