import { Injectable, Logger } from '@nestjs/common';
import { ErrorManager } from '@/helpers/error.manager';
//import * as puppeteer from 'puppeteer';

@Injectable()
export class GenerateReportPdfService {
/*
SERVIICE DEPRECADO - EL FRONTEND SE ECARGA DE GENERAR EL PDF
  private readonly logger = new Logger(GenerateReportPdfService.name);

  async generatePdf(html: string): Promise<Buffer> {
    const startTime = Date.now();
    this.logger.log('Iniciando generación de PDF');
    
    if (!html || html.trim().length === 0) {
      this.logger.error('HTML vacío o inválido recibido');
      throw new ErrorManager({
        type: 'BAD_REQUEST',
        message: 'El contenido HTML es requerido para generar el PDF',
      });
    }

    let browser = null;
    try {
      this.logger.debug('Configurando navegador Puppeteer');
      
      // Configuración mejorada del navegador
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--disable-accelerated-2d-canvas',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images', // Optimización: no cargar imágenes
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
        timeout: 10000, // Timeout para el launch
      });

      const page = await browser.newPage();
      this.logger.debug('Página del navegador creada');

      // Establecer timeout más largo para contenido pesado
      await page.setDefaultNavigationTimeout(15000);
      await page.setDefaultTimeout(15000);

      // Cargamos el contenido HTML con opciones mejoradas
      this.logger.debug('Cargando contenido HTML');
      await page.setContent(html, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 10000,
      });

      // Configuración mejorada del PDF
      this.logger.debug('Generando PDF');
      const pdfBuffer = await page.pdf({
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
        footerTemplate: `
            <div style="font-size: 10px; text-align: center; width: 100%;">
              <span class="pageNumber"></span> / <span class="totalPages"></span>
            </div>
          `,
      });

      await browser.close();
      browser = null; // Marcamos como cerrado
      
      const totalTime = Date.now() - startTime;
      const sizeKB = Math.round(pdfBuffer.length / 1024);
      this.logger.log(`PDF generado exitosamente - Tamaño: ${sizeKB}KB - Tiempo: ${totalTime}ms`);
      
      return Buffer.from(pdfBuffer);
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error(`Error generando PDF después de ${totalTime}ms: ${error.message}`, error.stack);
      
      // Identificar tipos específicos de errores
      if (error.message.includes('Navigation timeout')) {
        throw new ErrorManager({
          type: 'REQUEST_TIMEOUT',
          message: 'Timeout al procesar el contenido HTML - El contenido puede ser demasiado complejo',
        });
      }
      
      if (error.message.includes('Failed to launch')) {
        throw new ErrorManager({
          type: 'INTERNAL_SERVER_ERROR',
          message: 'Error de configuración del navegador - Dependencias de sistema faltantes',
        });
      }
      
      if (error instanceof ErrorManager) {
        throw error;
      }
      
      throw new ErrorManager({
        type: 'INTERNAL_SERVER_ERROR',
        message: `Error interno al generar PDF: ${error.message}`,
      });
      
    } finally {
      if (browser) {
        try {
          await browser.close();
          this.logger.debug('Navegador cerrado correctamente');
        } catch (closeError) {
          this.logger.warn(`Error cerrando el navegador: ${closeError.message}`);
        }
      }
    }
  }
    */
}
