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
            
            this.logger.debug(`Cache set: ${this.sanitizeKey(key)} ${ttl ? `with TTL ${ttl}s` : ''}`);
        } catch (error) {
            this.logger.error(`Failed to set cache key ${this.sanitizeKey(key)}:`, error);
            // No lanzamos el error para que la aplicación continue funcionando
        }
    } 

    async get(key: string): Promise<any> {
        try {
            const value = await this.redisClient.get(key);
            const result = value ? JSON.parse(value as string) : null;
            this.logger.debug(`Cache ${result ? 'hit' : 'miss'}: ${this.sanitizeKey(key)}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to get cache key ${this.sanitizeKey(key)}:`, error);
            return null; // Devolvemos null si falla, la app puede continuar sin cache
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redisClient.del(key);
            this.logger.debug(`Cache deleted: ${this.sanitizeKey(key)}`);
        } catch (error) {
            this.logger.error(`Failed to delete cache key ${this.sanitizeKey(key)}:`, error);
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
            await this.redisClient.quit();
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
                this.logger.debug(`Deleted ${keys.length} keys matching pattern: ${this.sanitizeKey(pattern)}`);
            }
        } catch (error) {
            this.logger.error(`Failed to delete keys with pattern ${this.sanitizeKey(pattern)}:`, error);
        }
    }

    // Método privado para sanitizar claves sensibles en los logs
    private sanitizeKey(key: string): string {
        // Ocultar nombres de usuario en claves como "user:username"
        if (key.startsWith('user:')) {
            return 'user:[PROTECTED]';
        }
        
        // Ocultar IDs específicos de usuarios
        if (key.includes('userId:') || key.includes('user_id:')) {
            return key.replace(/userId?:\d+/g, 'userId:[PROTECTED]').replace(/user_id:\d+/g, 'user_id:[PROTECTED]');
        }
        
        // Ocultar tokens de sesión
        if (key.includes('session:') || key.includes('token:')) {
            return key.replace(/(session|token):[a-zA-Z0-9-_]+/g, '$1:[PROTECTED]');
        }
        
        // Ocultar información de tarjetas de crédito
        if (key.includes('card:') || key.includes('creditcard:')) {
            return key.replace(/(card|creditcard):[a-zA-Z0-9-_]+/g, '$1:[PROTECTED]');
        }
        
        // Para otras claves, mostrar solo el prefijo si contiene dos puntos
        if (key.includes(':') && key.split(':').length > 2) {
            const parts = key.split(':');
            return `${parts[0]}:${parts[1]}:[PROTECTED]`;
        }
        
        return key; // Claves seguras como "allBankAccounts", "GLOBAL_BANKS", etc.
    }
}
