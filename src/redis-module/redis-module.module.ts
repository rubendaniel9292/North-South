import { Global, Module } from '@nestjs/common';
import { RedisModuleService } from './services/redis-module.service';
import { createClient } from 'redis';
@Global()//para usarse en cualquier modulo sin necesidad de modificar el module.ts de cada modulo
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory:  async () => {
        const client = createClient({
          url: 'redis://localhost:6379',
        });
        client.on('error', (err) => console.error('Redis Client Error', err));
        await client.connect(); // Conectar el cliente Redis
        console.log('Redis Client Connected');
        return client;
      },
    },
    RedisModuleService,
  ],
  exports: ['REDIS_CLIENT', RedisModuleService],
})
  
export class RedisModuleModule { }
