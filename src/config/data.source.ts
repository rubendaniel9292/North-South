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
/*
console.log('DB_HOST:', configService.get('DB_HOST'));
console.log('DB_PORT:', configService.get('DB_PORT'));
console.log('DB_USER:', configService.get('DB_USER'));
console.log('DB_PASSWORD:', configService.get('DB_PASSWORD'));
console.log('DB_NAME:', configService.get('DB_NAME'));*/
//atributos del data source
export const DataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: parseInt(process.env.DB_PORT, 10),
  username: configService.get('DB_USER').toString(),
  password: configService.get('DB_PASSWORD').toString(),
  database: configService.get('DB_NAME').toString(),
  //port: configService.get('DB_PORT'),
  //username: configService.get('DB_USER'),
  //password: configService.get('DB_PASSWORD'),
  //database: configService.get('DB_NAME'),
  entities: [__dirname + '../../**/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: true,
  migrationsRun: true,
  /* solo para modo produccion: establecer una conexión segura (SSL) a la base de datos
  false si aun no esta configurado el ssl en el servidor, true si ya esta configurado
  */
  /*
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },*/
  logging: false,
  namingStrategy: new SnakeNamingStrategy(),
};

//migraciones para cuando el servidor este apagado
export const AppDS = new DataSource(DataSourceConfig);
