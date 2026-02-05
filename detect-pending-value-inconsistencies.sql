-- ============================================================
-- DETECTAR INCONSISTENCIAS DE PENDING_VALUE
-- ============================================================
-- Este script identifica pagos donde el pending_value NO disminuye
-- correctamente o es el mismo en pagos consecutivos

-- 1️⃣ DETECTAR: Pagos consecutivos con MISMO pending_value (INCORRECTO)
SELECT 
    p."number_policy" as numero_poliza,
    p.id as policy_id,
    pr.number_payment as numero_pago,
    pr.value as valor_pago,
    pr.pending_value as valor_pendiente,
    LAG(pr.pending_value) OVER (PARTITION BY pr.policy_id ORDER BY pr.number_payment) as pending_anterior,
    pr.pending_value - LAG(pr.pending_value) OVER (PARTITION BY pr.policy_id ORDER BY pr.number_payment) as diferencia,
    CASE 
        WHEN pr.pending_value = LAG(pr.pending_value) OVER (PARTITION BY pr.policy_id ORDER BY pr.number_payment) 
        THEN '⚠️ MISMO PENDING (ERROR)'
        WHEN pr.pending_value > LAG(pr.pending_value) OVER (PARTITION BY pr.policy_id ORDER BY pr.number_payment)
        THEN '❌ PENDING AUMENTÓ (ERROR)'
        ELSE '✅ OK'
    END as estado
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
WHERE p.policy_status_id = 1  -- Solo pólizas activas
ORDER BY p."number_policy", pr.number_payment;

-- 2️⃣ RESUMEN: Pólizas con pagos que tienen pending_value inconsistente
SELECT 
    p."number_policy" as numero_poliza,
    COUNT(*) as pagos_con_error,
    STRING_AGG(DISTINCT pr.number_payment::text, ', ' ORDER BY pr.number_payment::text) as numeros_pagos_afectados
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
WHERE pr.pending_value = (
    SELECT LAG(pr2.pending_value) OVER (PARTITION BY pr2.policy_id ORDER BY pr2.number_payment)
    FROM payment_record pr2
    WHERE pr2.policy_id = pr.policy_id 
      AND pr2.number_payment = pr.number_payment
)
AND p.policy_status_id = 1
GROUP BY p."number_policy"
ORDER BY pagos_con_error DESC;

-- 3️⃣ DETECTAR: Duplicados + pending_value inconsistente (DOBLE ERROR)
WITH duplicates AS (
    SELECT policy_id, number_payment, COUNT(*) as dup_count
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
)
SELECT 
    p."number_policy" as numero_poliza,
    pr.number_payment as num_pago,
    COUNT(*) as cantidad_duplicados,
    STRING_AGG(pr.id::text, ', ' ORDER BY pr.id) as payment_ids,
    STRING_AGG(DISTINCT pr.pending_value::text, ' | ') as pending_values,
    CASE 
        WHEN COUNT(DISTINCT pr.pending_value) = 1 THEN '⚠️ Mismo pending en duplicados'
        ELSE '❌ Diferentes pending (corrupción)'
    END as diagnostico
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
INNER JOIN duplicates d ON pr.policy_id = d.policy_id AND pr.number_payment = d.number_payment
GROUP BY p."number_policy", pr.number_payment
ORDER BY p."number_policy", pr.number_payment;

-- 4️⃣ CASO ESPECÍFICO: Póliza BI00776359 (la de tu imagen)
SELECT 
    pr.id as payment_id,
    pr.number_payment as numero_pago,
    pr.value as valor,
    pr.pending_value as pendiente,
    pr.created_at as fecha_creacion,
    CASE 
        WHEN pr.id = MAX(pr.id) OVER (PARTITION BY pr.policy_id, pr.number_payment) 
        THEN '✅ SE MANTIENE'
        ELSE '🗑️ SE ELIMINA'
    END as accion_duplicados,
    -- Calcular lo que DEBERÍA ser el pending_value
    (SELECT p.policy_value FROM policy p WHERE p.id = pr.policy_id) - 
    (SELECT COALESCE(SUM(pr2.value), 0) 
     FROM payment_record pr2 
     WHERE pr2.policy_id = pr.policy_id 
       AND pr2.number_payment <= pr.number_payment
       AND pr2.id = (SELECT MAX(id) FROM payment_record WHERE policy_id = pr2.policy_id AND number_payment = pr2.number_payment)
    ) as pending_correcto,
    pr.pending_value - (
        (SELECT p.policy_value FROM policy p WHERE p.id = pr.policy_id) - 
        (SELECT COALESCE(SUM(pr2.value), 0) 
         FROM payment_record pr2 
         WHERE pr2.policy_id = pr.policy_id 
           AND pr2.number_payment <= pr.number_payment
           AND pr2.id = (SELECT MAX(id) FROM payment_record WHERE policy_id = pr2.policy_id AND number_payment = pr2.number_payment)
        )
    ) as diferencia_vs_correcto
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
WHERE p."number_policy" = 'BI00776359'
ORDER BY pr.number_payment, pr.id;
