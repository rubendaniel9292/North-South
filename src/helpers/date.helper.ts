/**
 * Helper simplificado para manejar fechas en la aplicación
 * 
 * 🔥 IMPORTANTE - USO CORRECTO:
 * 
 * 1. normalizeDateForDB():
 *    - Usar SOLO para fechas que vienen del FRONTEND (startDate, endDate, etc.)
 *    - Suma +1 día para compensar la zona horaria UTC
 *    - Establece hora a 00:00:00
 * 
 * 2. normalizeDateForComparison():
 *    - Usar para fechas INTERNAS calculadas por el backend
 *    - NO suma días, solo establece hora a 00:00:00
 *    - Usar para createdAt de pagos generados automáticamente
 *    - Usar para comparaciones entre fechas
 * 
 * ⚠️ NUNCA usar normalizeDateForDB para fechas ya normalizadas o calculadas internamente
 */

export class DateHelper {
    /**
     * Normaliza una fecha para guardar en la base de datos
     * 🔥 USAR SOLO PARA FECHAS DEL FRONTEND (startDate, endDate)
     * @param date Fecha a normalizar
     * @returns Fecha normalizada (+1 día para compensar zona horaria)
     */
    static normalizeDateForDB(date: Date | string): Date {
        const normalizedDate = new Date(date);
        // +1 día para compensar zona horaria UTC cuando viene del frontend
        normalizedDate.setDate(normalizedDate.getDate() + 1);
        normalizedDate.setHours(0, 0, 0, 0);
        return normalizedDate;
    }
    
    /**
     * Normaliza una fecha para comparaciones o cálculos internos
     * 🔥 USAR PARA FECHAS GENERADAS POR EL BACKEND (createdAt de pagos)
     * @param date Fecha a normalizar
     * @returns Fecha normalizada (SIN sumar días, solo hora a 00:00:00)
     */
    static normalizeDateForComparison(date: Date | string): Date {
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        return normalizedDate;
    }
}