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
    p."number_policy" AS numero_poliza,
    p.id AS policy_id,
    p.policy_status_id AS estado_poliza,
    ps.status_name AS nombre_estado,
    COUNT(*) AS grupos_de_numeros_duplicados,
    SUM(dup.duplicate_count) AS total_registros_involucrados,
    SUM(dup.duplicate_count - 1) AS registros_sobrantes
FROM policy p
INNER JOIN (
    SELECT
        policy_id,
        number_payment,
        COUNT(*) AS duplicate_count
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
) AS dup ON p.id = dup.policy_id
LEFT JOIN policy_status ps ON p.policy_status_id = ps.id
GROUP BY
    p.id,
    p."number_policy",
    p.policy_status_id,
    ps.status_name
ORDER BY registros_sobrantes DESC, p."number_policy";

--O POR ID--
SELECT
    policy_id,
    number_payment,
    COUNT(*) AS total_registros,
    COUNT(*) - 1 AS registros_sobrantes
FROM payment_record
WHERE policy_id = 13
GROUP BY policy_id, number_payment
HAVING COUNT(*) > 1
ORDER BY number_payment;


-- 3️⃣ DETALLE COMPLETO: Todos los pagos duplicados con información de póliza
-- Criterio: conservar primero un pago AL DÍA (status_payment_id = 2).
-- Si todos están ATRASADOS, conservar el de mayor ID.
--Para previsualizar qué se conservaría y qué se eliminaría:--
WITH duplicate_groups AS (
    SELECT
        policy_id,
        number_payment,
        COUNT(*) AS cantidad_registros
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
), ranked_payments AS (
    SELECT
        pr.*,
        dg.cantidad_registros,
        ROW_NUMBER() OVER (
            PARTITION BY pr.policy_id, pr.number_payment
            ORDER BY
                CASE WHEN pr.status_payment_id = 2 THEN 0 ELSE 1 END,
                pr.id DESC
        ) AS posicion
    FROM payment_record pr
    INNER JOIN duplicate_groups dg
        ON dg.policy_id = pr.policy_id
       AND dg.number_payment = pr.number_payment
)
SELECT
    p."number_policy" AS numero_poliza,
    rp.policy_id,
    rp.number_payment AS numero_pago,
    rp.cantidad_registros AS cantidad_duplicados,
    rp.id AS payment_id,
    rp.value AS valor,
    rp.pending_value AS pendiente,
    rp.status_payment_id AS estado_pago,
    rp.updated_at AS fecha_actualizacion,
    CASE
        WHEN rp.posicion = 1 THEN '✅ SE MANTIENE (AL DÍA o más reciente)'
        ELSE '🗑️ SE ELIMINARÁ'
    END AS accion
FROM ranked_payments rp
INNER JOIN policy p ON rp.policy_id = p.id
LEFT JOIN policy_status ps ON p.policy_status_id = ps.id
ORDER BY rp.policy_id, rp.number_payment, rp.posicion;

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
