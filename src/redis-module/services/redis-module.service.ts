import { Injectable, Inject, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisModuleService {
    private readonly logger = new Logger(RedisModuleService.name);

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    ) { }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        try {
            await this.redisClient.set(key, JSON.stringify(value));
            if (ttl) {
                await this.redisClient.expire(key, ttl);
            }
            this.logger.debug(`Cache set: ${key} ${ttl ? `with TTL ${ttl}s` : ''}`);
        } catch (error) {
            this.logger.error(`Failed to set cache key ${key}:`, error);
            // No lanzamos el error para que la aplicación continue funcionando
        }
    } 

    async get(key: string): Promise<any> {
        try {
            const value = await this.redisClient.get(key);
            const result = value ? JSON.parse(value as string) : null;
            this.logger.debug(`Cache ${result ? 'hit' : 'miss'}: ${key}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to get cache key ${key}:`, error);
            return null; // Devolvemos null si falla, la app puede continuar sin cache
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redisClient.del(key);
            this.logger.debug(`Cache deleted: ${key}`);
        } catch (error) {
            this.logger.error(`Failed to delete cache key ${key}:`, error);
        }
    }

    //metodo para que se eliminen los datos de redis cada que se reinicia la aplicacion
    async flushAll(): Promise<void> {
        try {
            await this.redisClient.flushAll();
            this.logger.log('Cache flushed successfully');
        } catch (error) {
            this.logger.error('Failed to flush cache:', error);
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.redisClient.disconnect();
            this.logger.log('Redis client disconnected');
        } catch (error) {
            this.logger.error('Failed to disconnect Redis client:', error);
        }
    }

    // Método adicional para verificar si Redis está conectado
    async isConnected(): Promise<boolean> {
        try {
            await this.redisClient.ping();
            return true;
        } catch (error) {
            this.logger.error('Redis ping failed:', error);
            return false;
        }
    }

    // Método para invalidar múltiples keys con patrón
    async deletePattern(pattern: string): Promise<void> {
        try {
            const keys = await this.redisClient.keys(pattern);
            if (keys.length > 0) {
                await this.redisClient.del(keys);
                this.logger.debug(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
            }
        } catch (error) {
            this.logger.error(`Failed to delete keys with pattern ${pattern}:`, error);
        }
    }
}
