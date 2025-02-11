//objeto enum para datos fijos que no cambiaran constante usan un prefijo global para agrupar claves para evitar colisiones:
export enum CacheKeys {
    GLOBAL_PROVINCES = 'global:provinces:all',
    GLOBAL_CITIES = 'global:cities:all',
    GLOBAL_CIVIL_STATUS = 'global:civil-status:all',
    GLOBAL_BANKS = 'global:allBanks:all',
    GLOBAL_TYES_ACCOUNTS = 'global:allTypeAccounts:all',
    GLOBAL_CARD_OPTIONS = 'golbal:allOptions:all',
    GLOBAL_POLICY_TYPE = 'global:types:all',
    GLOBAL_PAYMENT_METHOD = 'global:allPaymentMethod:all',
    GLOBAL_PAYMENT_FREQUENCY = 'global:frecuency:all',
    GLOBAL_COMPANY = 'global:allCompany:all',
}