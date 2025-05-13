/**
 * Helper simplificado para manejar fechas en la aplicación
 */
export class DateHelper {
    /**
     * Normaliza una fecha para guardar en la base de datos
     * @param date Fecha a normalizar
     * @returns Fecha normalizada
     */
    static normalizeDateForDB(date: Date | string): Date {
        const normalizedDate = new Date(date);
        //normalizedDate.setDate(normalizedDate.getDate());
        normalizedDate.setDate(normalizedDate.getDate() + 1);
        normalizedDate.setHours(0, 0, 0, 0);  
        return normalizedDate;
    }
    static normalizeDateForComparison(date: Date): Date {
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        return normalizedDate;
    }
}