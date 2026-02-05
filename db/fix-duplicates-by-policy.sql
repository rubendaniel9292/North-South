-- ============================================================
-- ELIMINAR DUPLICADOS DE UNA PÓLIZA ESPECÍFICA
-- ============================================================
-- Úsalo para probar póliza por póliza antes de la eliminación masiva
-- Reemplaza 'GM25G53215' con el número de póliza que quieras limpiar
-- ============================================================

-- PASO 1: Ver los duplicados de esta póliza ANTES de eliminar
SELECT 
    pr.id as payment_id,
    p."number_policy" as numero_poliza,
    pr.number_payment as num_pago,
    pr.value as valor,
    pr.pending_value as pendiente,
    pr.created_at as fecha_creacion,
    SUBSTRING(pr.observations, 1, 50) as observaciones,
    CASE 
        WHEN pr.id = MAX(pr.id) OVER (PARTITION BY pr.policy_id, pr.number_payment) 
        THEN '✅ SE MANTIENE (más reciente)'
        ELSE '🗑️ SE ELIMINARÁ'
    END as accion
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
WHERE p."number_policy" = 'GM25G53215'  -- 👈 CAMBIA ESTE NÚMERO
  AND (pr.policy_id, pr.number_payment) IN (
      SELECT policy_id, number_payment
      FROM payment_record
      GROUP BY policy_id, number_payment
      HAVING COUNT(*) > 1
  )
ORDER BY pr.number_payment, pr.id;

-- PASO 2: Eliminar duplicados de ESTA póliza específica
-- (Ejecuta solo después de verificar el PASO 1)

BEGIN;

WITH duplicates AS (
    SELECT 
        pr.policy_id,
        pr.number_payment,
        MAX(pr.id) as keep_id,
        COUNT(*) as duplicate_count
    FROM payment_record pr
    INNER JOIN policy p ON pr.policy_id = p.id
    WHERE p."number_policy" = 'GM25G53215'  -- 👈 CAMBIA ESTE NÚMERO
    GROUP BY pr.policy_id, pr.number_payment
    HAVING COUNT(*) > 1
)
DELETE FROM payment_record pr
USING duplicates d
WHERE pr.policy_id = d.policy_id 
  AND pr.number_payment = d.number_payment
  AND pr.id != d.keep_id;

-- PostgreSQL mostrará automáticamente: "DELETE X" donde X es el número de filas eliminadas

COMMIT;


-- PASO 3: Verificar que ya no hay duplicados en esta póliza
-- (Ejecuta después del PASO 2)
/*
SELECT 
    pr.number_payment as num_pago,
    COUNT(*) as cantidad
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
WHERE p."number_policy" = 'GM25G53215'  -- 👈 CAMBIA ESTE NÚMERO
GROUP BY pr.number_payment
HAVING COUNT(*) > 1;

-- Si retorna 0 filas = ✅ Sin duplicados
*/

-- PASO 4: Ver TODOS los pagos de esta póliza ordenados
-- (Para verificar que la secuencia quedó correcta)
/*
SELECT 
    pr.id as payment_id,
    pr.number_payment as num_pago,
    pr.value as valor,
    pr.pending_value as pendiente,
    pr.created_at as fecha_creacion
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
WHERE p."number_policy" = 'GM25G53215'  -- 👈 CAMBIA ESTE NÚMERO
ORDER BY pr.number_payment;
*/
