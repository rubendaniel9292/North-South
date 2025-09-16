import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe, INestApplication } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import * as morgan from 'morgan';
import * as winston from 'winston';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import * as hpp from 'hpp';
import * as https from 'https';
import { promises as fs } from 'fs';
import { CORS } from './constants/cors';
import AppModule from './app.module';

//para registrar detalles importantes de cada solicitud, como IP, método HTTP y agente de usuario
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Mostrar logs en la consola
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/security.log', level: 'info' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Middleware de logging de seguridad
const securityLoggingMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  logger.info({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin
  });
  next();
};

// Middleware de sanitización personalizado para mitigar riesgos de inyección SQL o NoSQL.

const sanitizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any, isToken = false, isPassword = false): any => {
    if (typeof value === 'string') {
      // No sanitizar si es un token de Turnstile o una contraseña
      if (isToken || isPassword) return value;

      return value
        .replace(/<script.*?>.*?<\/script>/gim, '')
        .replace(/[;<>&]/g, '')
        .replace(/[${}]/g, '') // Sanitización para MongoDB
        .trim();
    }
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).reduce((acc, key) => {
        const isPasswordField = key === 'password' || key === 'newPassword' || key === 'currentPassword' || key === 'confirmPassword';
        const isTurnstileField = key === 'turnstileToken';
        
        return {
          ...acc,
          [key]: sanitizeValue(value[key], isTurnstileField, isPasswordField)
        };
      }, {});
    }
    return value;
  };

  req.body = sanitizeValue(req.body);
  // IMPORTANTE: continuar la cadena de middlewares. Faltaba llamar a next(),
  // lo que provocaba que la petición quedara colgada y el reverse proxy devolviera 502.
  next();
};



// Configuración de Rate Limiting optimizada para proxy
const rateLimitConfig = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 1200 : undefined, // 200 en producción, sin límite en desarrollo
  message: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente después de 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
  // Generador de key personalizado para mejor identificación con proxy
  keyGenerator: (req) => {
    // En desarrollo, usar IP simple para evitar problemas
    if (process.env.NODE_ENV !== 'production') {
      return req.ip;
    }
    // En producción, usar X-Forwarded-For si está disponible
    const forwardedIps = req.headers['x-forwarded-for'];
    if (forwardedIps && typeof forwardedIps === 'string') {
      // Tomar la primera IP de la cadena (IP real del cliente)
      return forwardedIps.split(',')[0].trim();
    }
    return req.ip;
  },
  // Skip para IPs internas/locales y desarrollo local
  skip: (req) => {
    const ip = req.ip;
    // No aplicar rate limit a IPs locales/internas
    const isLocalIP = ip === '192.168.61.110' || ip === '::1' || '' || ip?.startsWith('192.168.') || ip?.startsWith('10.');
    // En desarrollo, ser más permisivo
    const isDevelopment = process.env.NODE_ENV !== 'production';
    return isLocalIP || (isDevelopment && (ip === '::ffff:192.168.61.110' || ip?.includes('localhost')));
  }
});

async function setupSecurityMiddleware(app: INestApplication): Promise<void> {
  // Helmet: minimiza riesgos como ataques XSS e inyección de contenido no autorizado y ocultar encabezados sensibles
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Necesario para muchos frameworks frontend
        styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"], // Más permisivo para estilos
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"], // Importante para API calls y websockets
        fontSrc: ["'self'", "https:", "data:", "http:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin']
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: false,
    referrerPolicy: { policy: 'no-referrer' },
    hidePoweredBy: true,
    xssFilter: true,
    noSniff: true,
    ieNoOpen: true,
    hsts: process.env.NODE_ENV === 'production' ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    } : false
  }));

  // Límite de tamaño para el body
  app.use(express.json({ limit: '15kb' }));
  app.use(express.urlencoded({ extended: true, limit: '15kb' }));

  // Middlewares de seguridad adicionales

  // Protección XSS manejada por nuestro middleware personalizado de sanitización
  app.use(hpp({ whitelist: [] }));
  app.use('/api', rateLimitConfig);
  app.use(securityLoggingMiddleware);
  app.use(sanitizationMiddleware);
}
//FUNCION DE CARGA DE CERTIFICADOS
async function loadHttpsCredentials(): Promise<https.ServerOptions | null> {
  const keyPath = process.env.KEY_PATH;
  const certPath = process.env.CERT_PATH;

  try {
    if (!keyPath || !certPath) return null;

    const [keyExists, certExists] = await Promise.all([
      fs.access(keyPath).then(() => true).catch(() => false),
      fs.access(certPath).then(() => true).catch(() => false)
    ]);

    if (!keyExists || !certExists) {
      logger.warn('Certificados SSL no encontrados');
      return null;
    }

    const [key, cert] = await Promise.all([
      fs.readFile(keyPath),
      fs.readFile(certPath)
    ]);

    logger.info('Certificados SSL cargados exitosamente');
    return { key, cert };
  } catch (error) {
    logger.error('Error al cargar certificados SSL:', error);
    return null;
  }
}

async function bootstrap() {
  try {
    // Crear la aplicación NestJS
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'debug', 'log', 'verbose']
    });

    // CONFIGURAR TRUST PROXY DE MANERA ESPECÍFICA Y SEGURA
    // En lugar de 'true' (permisivo), configuramos de manera específica
    const expressApp = app.getHttpAdapter().getInstance();
    
    // Opción 1: Confiar solo en el primer proxy (Nginx)
    expressApp.set('trust proxy', 1);
    
    // Opción 2 alternativa: Confiar en rangos específicos de IP (descomenta si necesitas)
    // expressApp.set('trust proxy', ['127.0.0.1', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']);
    
    // Opción 3 alternativa: Función personalizada (descomenta si necesitas control total)
    // expressApp.set('trust proxy', (ip: string) => {
    //   // Confiar solo en IPs específicas de tu infraestructura
    //   return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.');
    // });

    // Habilitar CORS
    app.enableCors(CORS);
    app.setGlobalPrefix('api');
    //app.use(morgan('combined'));
    // Configurar Morgan para mostrar logs en la consola
    app.use(morgan('combined', {
      stream: {
        write: (message) => {
          logger.info(message.trim());
        }
      }
    }))
    /*
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log('CORS Origin:', req.headers.origin);
      console.log('CORS Method:', req.method);
      next();
    });*/
    // Middleware para manejar solicitudes OPTIONS
    /*
    interface RequestWithMethod extends Request {
      method: string;
    }

    type ResponseWithSendStatus = Response & {
      sendStatus: (statusCode: number) => Response;
    };

    app.use((req: RequestWithMethod, res: ResponseWithSendStatus, next: NextFunction) => {
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
      } else {
        next();
      }
    });*/

    // Configurar middlewares de seguridad
    setupSecurityMiddleware(app);

    // Configurar validación global de pipes
    //ayuda a garantizar que solo datos válidos y permitidos lleguen a los controladores para transformar y bloquear propiedades no deseadas

    app.useGlobalPipes(new ValidationPipe({
      //whitelist: true, // Elimina propiedades que no están en el DTO comentada porque no permite generar reporte
      forbidNonWhitelisted: true, // Lanza un error si hay propiedades que no están en el DTO
      transform: true, // Transforma los tipos de datos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',//comentar de ser necesario para ver logs de error en prod
    }),
    );


    // Configurar serialización
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
    //app.use(responseTime())

    // Configurar redirección HTTPS el servidor redirige tráfico HTTP a HTTPS

    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.secure) {
        logger.debug('Conexión HTTPS establecida');
        next();
      } else {
        logger.debug('Redirigiendo a HTTPS');
        res.redirect(`https://${req.headers.host}${req.url}`);
      }
    });

    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'OPTIONS') {
        res.sendStatus(204); // Responde correctamente a las solicitudes preflight
      } else if (req.secure) {
        next();
      } else {
        res.redirect(`https://${req.headers.host}${req.url}`);
      }
    });
    /*
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log('Request Headers:', req.headers);
      next();
    });*/

    // Iniciar servidores
    const httpPort = process.env.PORT;
    const httpsPort = process.env.HTTPS_PORT;
    const httpsOptions = await loadHttpsCredentials();

    // Iniciar HTTP
    await app.listen(httpPort);
    //console.log('LOG DE CONSOLE: APP INICIADA EN EL PUERTO ', httpPort)
    logger.info(`Servidor HTTP iniciado en puerto ${httpPort}`);

    // Iniciar HTTPS si hay certificados
    if (httpsOptions) {
      const httpsServer = https.createServer(
        httpsOptions,
        app.getHttpAdapter().getInstance()
      );

      await new Promise<void>((resolve) => {
        httpsServer.listen(httpsPort, () => {
          logger.info(`Servidor HTTPS iniciado en puerto ${httpsPort}`);
          resolve();
        });
      });
    }

  } catch (error) {
    logger.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();