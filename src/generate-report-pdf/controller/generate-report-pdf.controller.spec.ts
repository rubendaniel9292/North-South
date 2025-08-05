import { Test, TestingModule } from '@nestjs/testing';
import { GenerateReportPdfController } from './generate-report-pdf.controller';
import { GenerateReportPdfService } from '../services/generate-report-pdf.service';
import { ReportFactory } from '../utils/factory-report';
import { ErrorManager } from '@/helpers/error.manager';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Reflector } from '@nestjs/core';

describe('GenerateReportPdfController', () => {
  let controller: GenerateReportPdfController;
  let pdfService: GenerateReportPdfService;
  let reportFactory: ReportFactory;
  let mockResponse: Partial<Response>;

  const mockPdfBuffer = Buffer.from('fake-pdf-content');
  const mockHtml = '<html><body>Test Report</body></html>';

  // Mock UserService
  const mockUserService = {
    findUserById: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    // Mock Response object
    mockResponse = {
      set: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenerateReportPdfController],
      providers: [
        {
          provide: GenerateReportPdfService,
          useValue: {
            generatePdf: jest.fn(),
          },
        },
        {
          provide: ReportFactory,
          useValue: {
            generateHtml: jest.fn(),
          },
        },
        {
          provide: 'UserService',
          useValue: mockUserService,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
    .overrideGuard(require('@/auth/guards/auth.guard').AuthGuard)
    .useValue({
      canActivate: jest.fn(() => true),
    })
    .overrideGuard(require('@/auth/guards/roles.guard').RolesGuard)
    .useValue({
      canActivate: jest.fn(() => true),
    })
    .compile();

    controller = module.get<GenerateReportPdfController>(GenerateReportPdfController);
    pdfService = module.get<GenerateReportPdfService>(GenerateReportPdfService);
    reportFactory = module.get<ReportFactory>(ReportFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadPdf', () => {
    const validBody = {
      type: 'policy',
      data: {
        policyNumber: 'POL-001',
        customerName: 'Juan Pérez',
        premium: 1200.00,
      },
    };

    it('debería generar y descargar PDF exitosamente', async () => {
      // Arrange
      jest.spyOn(reportFactory, 'generateHtml').mockReturnValue(mockHtml);
      jest.spyOn(pdfService, 'generatePdf').mockResolvedValue(mockPdfBuffer);

      // Act
      await controller.downloadPdf(validBody, mockResponse as Response);

      // Assert
      expect(reportFactory.generateHtml).toHaveBeenCalledWith('policy', validBody.data);
      expect(pdfService.generatePdf).toHaveBeenCalledWith(mockHtml);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringContaining('policy-report'),
        'Content-Length': mockPdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      expect(mockResponse.send).toHaveBeenCalledWith(mockPdfBuffer);
    });

    it('debería manejar cuerpo de petición sin tipo', async () => {
      // Arrange
      const invalidBody = { data: validBody.data };

      // Act
      await controller.downloadPdf(invalidBody as any, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'El tipo de reporte es requerido',
        timestamp: expect.any(String),
      });
      expect(reportFactory.generateHtml).not.toHaveBeenCalled();
      expect(pdfService.generatePdf).not.toHaveBeenCalled();
    });

    it('debería manejar cuerpo de petición sin datos', async () => {
      // Arrange
      const invalidBody = { type: 'policy' };

      // Act
      await controller.downloadPdf(invalidBody as any, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Los datos del reporte son requeridos',
        timestamp: expect.any(String),
      });
    });

    it('debería manejar cuerpo de petición completamente vacío', async () => {
      // Act
      await controller.downloadPdf(null as any, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'El tipo de reporte es requerido',
        timestamp: expect.any(String),
      });
    });

    it('debería manejar errores de ReportFactory correctamente', async () => {
      // Arrange
      const factoryError = new ErrorManager({
        type: 'BAD_REQUEST',
        message: 'Tipo de reporte no soportado',
      });
      jest.spyOn(reportFactory, 'generateHtml').mockImplementation(() => {
        throw factoryError;
      });

      // Act
      await controller.downloadPdf(validBody, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Tipo de reporte no soportado',
        type: 'BAD_REQUEST',
        timestamp: expect.any(String),
      });
    });

    it('debería manejar errores de timeout del servicio PDF', async () => {
      // Arrange
      jest.spyOn(reportFactory, 'generateHtml').mockReturnValue(mockHtml);
      const timeoutError = new ErrorManager({
        type: 'REQUEST_TIMEOUT',
        message: 'Timeout al procesar el contenido HTML',
      });
      jest.spyOn(pdfService, 'generatePdf').mockRejectedValue(timeoutError);

      // Act
      await controller.downloadPdf(validBody, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.REQUEST_TIMEOUT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Timeout al procesar el contenido HTML',
        type: 'REQUEST_TIMEOUT',
        timestamp: expect.any(String),
      });
    });

    it('debería manejar errores internos del servidor', async () => {
      // Arrange
      jest.spyOn(reportFactory, 'generateHtml').mockReturnValue(mockHtml);
      const internalError = new ErrorManager({
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Error de configuración del navegador',
      });
      jest.spyOn(pdfService, 'generatePdf').mockRejectedValue(internalError);

      // Act
      await controller.downloadPdf(validBody, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error de configuración del navegador',
        type: 'INTERNAL_SERVER_ERROR',
        timestamp: expect.any(String),
      });
    });

    it('debería manejar errores genéricos correctamente', async () => {
      // Arrange
      jest.spyOn(reportFactory, 'generateHtml').mockReturnValue(mockHtml);
      const genericError = new Error('Unexpected error');
      jest.spyOn(pdfService, 'generatePdf').mockRejectedValue(genericError);

      // Act
      await controller.downloadPdf(validBody, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error interno generando el PDF',
        timestamp: expect.any(String),
      });
    });

    it('debería incluir fecha en el nombre del archivo', async () => {
      // Arrange
      jest.spyOn(reportFactory, 'generateHtml').mockReturnValue(mockHtml);
      jest.spyOn(pdfService, 'generatePdf').mockResolvedValue(mockPdfBuffer);

      // Act
      await controller.downloadPdf(validBody, mockResponse as Response);

      // Assert
      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Disposition': expect.stringMatching(/policy-report-\d{4}-\d{2}-\d{2}\.pdf/),
        })
      );
    });

    it('debería configurar headers de cache correctamente', async () => {
      // Arrange
      jest.spyOn(reportFactory, 'generateHtml').mockReturnValue(mockHtml);
      jest.spyOn(pdfService, 'generatePdf').mockResolvedValue(mockPdfBuffer);

      // Act
      await controller.downloadPdf(validBody, mockResponse as Response);

      // Assert
      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        })
      );
    });

    it('debería manejar diferentes tipos de reportes', async () => {
      // Arrange
      const paymentBody = {
        type: 'payment',
        data: [
          { paymentId: 'PAY-001', amount: 100.00 },
          { paymentId: 'PAY-002', amount: 150.00 },
        ],
      };
      jest.spyOn(reportFactory, 'generateHtml').mockReturnValue(mockHtml);
      jest.spyOn(pdfService, 'generatePdf').mockResolvedValue(mockPdfBuffer);

      // Act
      await controller.downloadPdf(paymentBody, mockResponse as Response);

      // Assert
      expect(reportFactory.generateHtml).toHaveBeenCalledWith('payment', paymentBody.data);
      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Disposition': expect.stringContaining('payment-report'),
        })
      );
    });
  });

  describe('getHttpStatusFromErrorType', () => {
    it('debería retornar status codes correctos para cada tipo de error', () => {
      // Arrange & Act & Assert
      expect((controller as any).getHttpStatusFromErrorType('BAD_REQUEST')).toBe(HttpStatus.BAD_REQUEST);
      expect((controller as any).getHttpStatusFromErrorType('REQUEST_TIMEOUT')).toBe(HttpStatus.REQUEST_TIMEOUT);
      expect((controller as any).getHttpStatusFromErrorType('NOT_FOUND')).toBe(HttpStatus.NOT_FOUND);
      expect((controller as any).getHttpStatusFromErrorType('INTERNAL_SERVER_ERROR')).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect((controller as any).getHttpStatusFromErrorType('UNKNOWN_TYPE')).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('extractErrorTypeFromMessage', () => {
    it('debería extraer el tipo de error del mensaje correctamente', () => {
      // Arrange & Act & Assert
      expect((controller as any).extractErrorTypeFromMessage('BAD_REQUEST::Mensaje de error')).toBe('BAD_REQUEST');
      expect((controller as any).extractErrorTypeFromMessage('REQUEST_TIMEOUT::Timeout error')).toBe('REQUEST_TIMEOUT');
      expect((controller as any).extractErrorTypeFromMessage('Simple error message')).toBe('INTERNAL_SERVER_ERROR');
      expect((controller as any).extractErrorTypeFromMessage('')).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('Logging', () => {
    it('debería tener logger configurado correctamente', () => {
      expect((controller as any).logger).toBeDefined();
      expect((controller as any).logger.context).toBe('GenerateReportPdfController');
    });
  });
});
