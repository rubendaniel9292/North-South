import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisModuleService {
    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    ) { }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        await this.redisClient.set(key, JSON.stringify(value));
        if (ttl) {
            await this.redisClient.expire(key, ttl);
        }
    }

    async get(key: string): Promise<any> {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
    }

    async del(key: string): Promise<void> {
        await this.redisClient.del(key);
    }

    //metodo para que se eliminen los datos de redis cada que se reinicia la aplicacion
    async flushAll(): Promise<void> {
        await this.redisClient.flushAll();
    }

    async disconnect(): Promise<void> {
        await this.redisClient.disconnect();
    }
}
