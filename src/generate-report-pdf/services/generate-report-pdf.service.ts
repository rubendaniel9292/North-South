import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class GenerateReportPdfService {
  private readonly logger = new Logger(GenerateReportPdfService.name);

  async generatePdf(html: string): Promise<Buffer> {
    let browser = null;
    try {
      // Configuración mejorada del navegador
      browser = await puppeteer.launch({
        headless: true, // Usar el nuevo modo headless
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--disable-accelerated-2d-canvas',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      });

      const page = await browser.newPage();

      // Establecer timeout más largo para contenido pesado
      await page.setDefaultNavigationTimeout(3000);

      // Cargamos el contenido HTML con opciones mejoradas
      await page.setContent(html, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 5000,
      });

      // Configuración mejorada del PDF
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
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(`Error generando PDF: ${error.message}`, error.stack);
      throw new Error(`Error al generar PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser
          .close()
          .catch((err: { message: any }) =>
            this.logger.warn(`Error cerrando el navegador: ${err.message}`),
          );
      }
    }
  }
}
