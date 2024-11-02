import { Test, TestingModule } from '@nestjs/testing';
import { GenerateReportPdfController } from './generate-report-pdf.controller';

describe('GenerateReportPdfController', () => {
  let controller: GenerateReportPdfController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenerateReportPdfController],
    }).compile();

    controller = module.get<GenerateReportPdfController>(
      GenerateReportPdfController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
