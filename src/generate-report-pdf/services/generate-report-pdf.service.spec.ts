import { Test, TestingModule } from '@nestjs/testing';
import { GenerateReportPdfService } from './generate-report-pdf.service';
import { ErrorManager } from '@/helpers/error.manager';
import * as puppeteer from 'puppeteer';

// Mock de Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

describe('GenerateReportPdfService', () => {
  let service: GenerateReportPdfService;
  let mockBrowser: any;
  let mockPage: any;

  const mockPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock del browser y page
    mockPage = {
      setDefaultNavigationTimeout: jest.fn(),
      setDefaultTimeout: jest.fn(),
      setContent: jest.fn(),
      pdf: jest.fn(),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    mockPuppeteer.launch.mockResolvedValue(mockBrowser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateReportPdfService],
    }).compile();

    service = module.get<GenerateReportPdfService>(GenerateReportPdfService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePdf', () => {
    const validHtml = '<html><body><h1>Test Document</h1></body></html>';
    const mockPdfBuffer = Buffer.from('fake-pdf-content');

    it('debería generar PDF exitosamente con HTML válido', async () => {
      // Arrange
      mockPage.pdf.mockResolvedValue(mockPdfBuffer);

      // Act
      const result = await service.generatePdf(validHtml);

      // Assert
      expect(result).toEqual(mockPdfBuffer);
      expect(mockPuppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: expect.arrayContaining([
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--disable-accelerated-2d-canvas',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
        ]),
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
        timeout: 10000,
      });
      expect(mockPage.setContent).toHaveBeenCalledWith(validHtml, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 10000,
      });
      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10px',
          right: '10px',
          bottom: '10px',
          left: '10px',
        },
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        footerTemplate: expect.stringContaining('pageNumber'),
      });
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it('debería lanzar BAD_REQUEST para HTML vacío', async () => {
      // Act & Assert
      await expect(service.generatePdf('')).rejects.toThrow(ErrorManager);
      await expect(service.generatePdf('')).rejects.toThrow('El contenido HTML es requerido para generar el PDF');
      
      // Verificar que no se llamó puppeteer
      expect(mockPuppeteer.launch).not.toHaveBeenCalled();
    });

    it('debería lanzar BAD_REQUEST para HTML nulo o undefined', async () => {
      await expect(service.generatePdf(null as any)).rejects.toThrow(ErrorManager);
      await expect(service.generatePdf(undefined as any)).rejects.toThrow(ErrorManager);
      
      expect(mockPuppeteer.launch).not.toHaveBeenCalled();
    });

    it('debería lanzar BAD_REQUEST para HTML solo con espacios', async () => {
      await expect(service.generatePdf('   ')).rejects.toThrow(ErrorManager);
      await expect(service.generatePdf('   ')).rejects.toThrow('El contenido HTML es requerido para generar el PDF');
    });

    it('debería manejar errores de timeout correctamente', async () => {
      // Arrange
      const timeoutError = new Error('Navigation timeout of 30000 ms exceeded');
      mockPage.setContent.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(service.generatePdf(validHtml)).rejects.toThrow(ErrorManager);
      await expect(service.generatePdf(validHtml)).rejects.toThrow('Timeout al procesar el contenido HTML');
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('debería manejar errores de launch de puppeteer', async () => {
      // Arrange
      const launchError = new Error('Failed to launch the browser process');
      mockPuppeteer.launch.mockRejectedValue(launchError);

      // Act & Assert
      await expect(service.generatePdf(validHtml)).rejects.toThrow(ErrorManager);
      await expect(service.generatePdf(validHtml)).rejects.toThrow('Error de configuración del navegador');
    });

    it('debería manejar errores genéricos correctamente', async () => {
      // Arrange
      const genericError = new Error('Unexpected error');
      mockPage.pdf.mockRejectedValue(genericError);

      // Act & Assert
      await expect(service.generatePdf(validHtml)).rejects.toThrow(ErrorManager);
      await expect(service.generatePdf(validHtml)).rejects.toThrow('Error interno al generar PDF');
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('debería cerrar el navegador incluso si hay error al cerrarlo', async () => {
      // Arrange
      mockPage.pdf.mockResolvedValue(mockPdfBuffer);
      mockPage.setContent.mockResolvedValue(undefined);
      
      // Configurar el browser.close() para fallar sólo la segunda vez (en el finally)
      // La primera llamada (en el flujo exitoso) debe tener éxito
      let closeCallCount = 0;
      mockBrowser.close.mockImplementation(() => {
        closeCallCount++;
        if (closeCallCount === 1) {
          // Primera llamada (flujo exitoso) - éxito
          return Promise.resolve();
        }
        // Las siguientes llamadas fallan
        return Promise.reject(new Error('Error closing browser'));
      });

      // Act
      const result = await service.generatePdf(validHtml);

      // Assert
      expect(result).toEqual(mockPdfBuffer);
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('debería propagar ErrorManager existentes correctamente', async () => {
      // Arrange
      const customError = new ErrorManager({
        type: 'BAD_REQUEST',
        message: 'Custom validation error'
      });
      mockPage.setContent.mockRejectedValue(customError);

      // Act & Assert
      await expect(service.generatePdf(validHtml)).rejects.toThrow(customError);
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('debería configurar timeouts correctamente', async () => {
      // Arrange
      mockPage.pdf.mockResolvedValue(mockPdfBuffer);

      // Act
      await service.generatePdf(validHtml);

      // Assert
      expect(mockPage.setDefaultNavigationTimeout).toHaveBeenCalledWith(15000);
      expect(mockPage.setDefaultTimeout).toHaveBeenCalledWith(15000);
    });

    it('debería manejar HTML complejo sin errores', async () => {
      // Arrange
      const complexHtml = `
        <html>
          <head>
            <style>
              body { font-family: Arial; }
              .header { background: #333; color: white; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Complex Document</h1>
            </div>
            <table>
              <tr><td>Data 1</td><td>Data 2</td></tr>
            </table>
          </body>
        </html>
      `;
      mockPage.pdf.mockResolvedValue(mockPdfBuffer);

      // Act
      const result = await service.generatePdf(complexHtml);

      // Assert
      expect(result).toEqual(mockPdfBuffer);
      expect(mockPage.setContent).toHaveBeenCalledWith(complexHtml, expect.any(Object));
    });
  });

  describe('Error Handling', () => {
    it('debería cerrar el navegador en el bloque finally', async () => {
      // Arrange
      mockPage.pdf.mockRejectedValue(new Error('PDF generation failed'));

      // Act
      try {
        await service.generatePdf('<html><body>Test</body></html>');
      } catch (error) {
        // Expected error
      }

      // Assert
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('debería manejar múltiples errores de cierre gracefully', async () => {
      // Arrange
      mockPage.pdf.mockResolvedValue(Buffer.from('test'));
      mockPage.setContent.mockResolvedValue(undefined);
      
      // Configurar el browser.close() para tener éxito la primera vez y fallar después
      let closeCallCount = 0;
      mockBrowser.close.mockImplementation(() => {
        closeCallCount++;
        if (closeCallCount === 1) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('First close error'));
      });

      // Act
      const result = await service.generatePdf('<html><body>Test</body></html>');

      // Assert 
      expect(result).toEqual(Buffer.from('test'));
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });
});
