
import { Test, TestingModule } from '@nestjs/testing';
import { GenerateReportPdfModule } from './generate-report-pdf.module';

describe('GenerateReportPdfModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GenerateReportPdfModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
