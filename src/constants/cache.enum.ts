import { Global } from '@nestjs/common';

//objeto enum para datos fijos que no cambiaran constante usan un prefijo global para agrupar claves para evitar colisiones:
export enum CacheKeys {
    GLOBAL_PROVINCES = 'global:provinces:all',
    GLOBAL_CITIES = 'global:cities:all',
    GLOBAL_CIVIL_STATUS = 'global:civil-status:all',
    GLOBAL_BANKS = 'global:allBanks:all',
    GLOBAL_TYPES_ACCOUNTS = 'global:allTypeAccounts:all', // Corregido TYES -> TYPES
    GLOBAL_CARD_OPTIONS = 'global:allOptions:all', // Corregido golbal -> global
    GLOBAL_POLICY_TYPE = 'global:types:all',
    GLOBAL_PAYMENT_METHOD = 'global:allPaymentMethod:all',
    GLOBAL_PAYMENT_FREQUENCY = 'global:frequency:all', // Corregido frecuency -> frequency
    GLOBAL_COMPANY = 'global:allCompany:all',
    GLOBAL_POLICY_STATUS = 'global:allStatusPolicies:all',
    GLOBAL_ALL_POLICIES = 'global:policies:all',
    GLOBAL_ALL_POLICIES_BY_STATUS = 'global:policiesStatus:all',
    GLOBAL_COMMISSIONS = 'global:commissions:all',
    GLOBAL_COMMISSION_REFUNDS = 'global:commissionRefunds:all',
    
    // User Module Cache Keys
    USERS_LIST = 'users:list',
    USER_BY_ID = 'user:', // Se concatena con UUID: user:${uuid}
    USER_TASKS = 'tasks:', // Se concatena con UUID: tasks:${uuid}
    TASK_BY_ID = 'task:', // Se concatena con ID: task:${id}
    
    // Cache patterns for deletion
    USER_PATTERN = 'user:*',
    TASKS_PATTERN = 'tasks:*',
    DASHBOARD_PATTERN = 'dashboard:*',
    PENDING_PATTERN = 'pending:*',
}