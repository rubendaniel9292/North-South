-- ============================================================
-- FIX: Eliminar pagos duplicados creados por race condition
-- ============================================================
-- Fecha: 2026-02-04
-- Problema: El scheduler crea pagos duplicados cuando se ejecuta
--           (mismo policy_id + mismo number_payment)
-- Solución: Eliminar duplicados + agregar constraint UNIQUE
-- ============================================================
-- NOTA: NO se toca pending_value porque las renovaciones lo 
--       reinician correctamente. Solo eliminamos duplicados.
-- ============================================================

BEGIN;

-- ============================================================
-- PASO 1: Identificar y eliminar duplicados existentes
-- ============================================================
-- Mantener el pago con ID más alto (el más reciente)

WITH duplicates AS (
    SELECT 
        policy_id,
        number_payment,
        MAX(id) as keep_id,
        COUNT(*) as duplicate_count
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
)
DELETE FROM payment_record pr
USING duplicates d
WHERE pr.policy_id = d.policy_id 
  AND pr.number_payment = d.number_payment
  AND pr.id != d.keep_id;

-- Mostrar cuántos se eliminaron
SELECT 'PASO 1 COMPLETADO: Duplicados eliminados' as status;

-- ============================================================
-- PASO 2: Agregar constraint UNIQUE para evitar futuros duplicados
-- ============================================================

ALTER TABLE payment_record 
ADD CONSTRAINT unique_payment_number_per_policy 
UNIQUE (policy_id, number_payment);

-- Mostrar resultado
SELECT 'PASO 2 COMPLETADO: Constraint UNIQUE creado' as status;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- Verificar que no queden duplicados
SELECT 
    COUNT(*) as duplicados_restantes,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Sin duplicados'
        ELSE '❌ AÚN HAY DUPLICADOS'
    END as estado
FROM (
    SELECT policy_id, number_payment
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
) sub;

-- Verificar el constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition,
    '✅ Constraint creado exitosamente' as status
FROM pg_constraint
WHERE conrelid = 'payment_record'::regclass
  AND conname = 'unique_payment_number_per_policy';

COMMIT;

-- ============================================================
-- RESULTADO ESPERADO:
-- - Duplicados eliminados (solo queda el más reciente)
-- - Constraint UNIQUE creado exitosamente
-- - Futuros intentos de crear pagos duplicados serán bloqueados
-- - Pending_value NO se toca (renovaciones lo manejan correctamente)
-- ============================================================
