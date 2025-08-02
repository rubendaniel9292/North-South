import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

//configuracion de nest para variables de entorno que remplaza a dotenv

//lee y setea las variables de entorno

ConfigModule.forRoot({
  envFilePath: `.${process.env.NODE_ENV}.env`,
  //envFilePath: `.env.${process.env.NODE_ENV || 'development'}.env`,
});

const configService = new ConfigService();

//atributos del data source
export const DataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: parseInt(process.env.DB_PORT, 10),
  username: configService.get('DB_USER').toString(),
  password: configService.get('DB_PASSWORD').toString(),
  database: configService.get('DB_NAME').toString(),
  entities: [__dirname + '../../**/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: true,
  migrationsRun: true,
  /* solo para modo produccion: establecer una conexión segura (SSL) a la base de datos
  false si aun no esta configurado el ssl en el servidor, true si ya esta configurado
  Los servidores de producción (AWS RDS, Google Cloud SQL, Azure, etc.) REQUIEREN SSL
  Acepta certificados SSL aunque no sean de una autoridad certificadora válida
  Es una medida de seguridad obligatoria
  */

  extra: {
    timezone: 'America/Guayaquil',


    // Esto es útil para entornos de desarrollo o pruebas, pero no recomendado en producción
    // Solo usar SSL en producción
    ...(process.env.NODE_ENV === 'production' && {
      ssl: {
        rejectUnauthorized: false, // Cambiar a true con certificados válidos
      },
    }),

    options: "-c timezone=America/Guayaquil",
  },

  logging: false,
  namingStrategy: new SnakeNamingStrategy(),
};

//migraciones para cuando el servidor este apagado
export const AppDS = new DataSource(DataSourceConfig);
