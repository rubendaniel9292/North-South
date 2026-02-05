-- ============================================
-- CONSULTA PARA ANALIZAR PAGOS DUPLICADOS
-- ============================================
-- Ejecuta estas queries para ver el alcance del problema ANTES de aplicar cambios

-- 1️⃣ RESUMEN: Total de pagos duplicados
SELECT 
    COUNT(DISTINCT policy_id) as polizas_afectadas,
    COUNT(*) as total_duplicados,
    SUM(duplicate_count - 1) as registros_a_eliminar
FROM (
    SELECT policy_id, number_payment, COUNT(*) as duplicate_count
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
) AS duplicates;

-- 2️⃣ DETALLE: Pólizas con duplicados y cuántos tienen
SELECT 
    p."number_policy" as numero_poliza,
    p.id as policy_id,
    p.policy_status_id as estado_poliza,
    ps.status_name as nombre_estado,
    COUNT(DISTINCT pr.number_payment) as pagos_duplicados,
    SUM(dup.duplicate_count) as total_registros_duplicados
FROM policy p
INNER JOIN (
    SELECT policy_id, number_payment, COUNT(*) as duplicate_count
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
) AS dup ON p.id = dup.policy_id
INNER JOIN payment_record pr ON pr.policy_id = dup.policy_id AND pr.number_payment = dup.number_payment
LEFT JOIN policy_status ps ON p.policy_status_id = ps.id
GROUP BY p.id, p."number_policy", p.policy_status_id, ps.status_name
ORDER BY total_registros_duplicados DESC, p."number_policy";

-- 3️⃣ DETALLE COMPLETO: Todos los pagos duplicados con información de póliza
SELECT 
    p."number_policy" as numero_poliza,
    p.id as policy_id,
    ps.status_name as estado_poliza,
    pr.number_payment as numero_pago,
    COUNT(*) as cantidad_duplicados,
    STRING_AGG(pr.id::text, ', ' ORDER BY pr.id) as payment_ids,
    MIN(pr.created_at) as primera_creacion,
    MAX(pr.created_at) as ultima_creacion,
    MIN(pr.value) as valor_min,
    MAX(pr.value) as valor_max,
    CASE 
        WHEN MIN(pr.value) = MAX(pr.value) THEN 'Valores iguales'
        ELSE 'Valores diferentes ⚠️'
    END as comparacion_valores
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
LEFT JOIN policy_status ps ON p.policy_status_id = ps.id
WHERE (pr.policy_id, pr.number_payment) IN (
    SELECT policy_id, number_payment
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
)
GROUP BY p."number_policy", p.id, ps.status_name, pr.number_payment
ORDER BY p."number_policy", pr.number_payment;

-- 4️⃣ EJEMPLO ESPECÍFICO: Detalles del caso conocido (póliza 65770F, pago #118)
SELECT 
    pr.id as payment_id,
    p."number_policy" as numero_poliza,
    pr.number_payment as numero_pago,
    pr.value as valor,
    pr.pending_value as valor_pendiente,
    pr.created_at as fecha_creacion,
    pr.observations as observaciones,
    CASE 
        WHEN pr.id = MAX(pr.id) OVER (PARTITION BY pr.policy_id, pr.number_payment) 
        THEN '✅ SE MANTIENE (más reciente)'
        ELSE '🗑️ SE ELIMINARÁ'
    END as accion
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
WHERE p."number_policy" = '65770F'
  AND pr.number_payment = 118
ORDER BY pr.id;

-- 5️⃣ VERIFICAR: ¿Hay duplicados con valores diferentes? (posible problema de datos)
SELECT 
    p."number_policy" as numero_poliza,
    pr.number_payment as numero_pago,
    COUNT(DISTINCT pr.value) as valores_diferentes,
    STRING_AGG(DISTINCT pr.value::text, ', ') as valores_encontrados,
    COUNT(*) as cantidad_registros
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
WHERE (pr.policy_id, pr.number_payment) IN (
    SELECT policy_id, number_payment
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
)
GROUP BY p."number_policy", pr.number_payment
HAVING COUNT(DISTINCT pr.value) > 1
ORDER BY p."number_policy", pr.number_payment;

-- 6️⃣ TIMELINE: ¿Cuándo se crearon los duplicados?
SELECT 
    DATE(pr.created_at) as fecha,
    COUNT(*) as duplicados_creados,
    COUNT(DISTINCT pr.policy_id) as polizas_afectadas
FROM payment_record pr
WHERE (pr.policy_id, pr.number_payment) IN (
    SELECT policy_id, number_payment
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
)
GROUP BY DATE(pr.created_at)
ORDER BY fecha DESC;
