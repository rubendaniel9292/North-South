import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { DataSourceConfig } from './entities/data.source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
//import { HttpModule } from '@nestjs/axios';
//import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [
    //lee y setea las variables de entorno
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({ ...DataSourceConfig }),
    UserModule,
    AuthModule,
  ],
})
export default class AppModule {}
