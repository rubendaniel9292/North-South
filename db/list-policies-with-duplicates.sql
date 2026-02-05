-- ============================================================
-- LISTA DE PÓLIZAS CON DUPLICADOS
-- ============================================================
-- Usa esto para saber cuáles pólizas necesitas limpiar una por una
-- ============================================================

WITH duplicates_detail AS (
    SELECT 
        pr.policy_id,
        pr.number_payment,
        COUNT(*) - 1 as registros_a_eliminar  -- Total menos 1 que se mantiene
    FROM payment_record pr
    WHERE (pr.policy_id, pr.number_payment) IN (
        SELECT policy_id, number_payment
        FROM payment_record
        GROUP BY policy_id, number_payment
        HAVING COUNT(*) > 1
    )
    GROUP BY pr.policy_id, pr.number_payment
)
SELECT 
    p."number_policy" as numero_poliza,
    p.id as policy_id,
    COUNT(*) as pagos_duplicados,
    STRING_AGG(DISTINCT dd.number_payment::text, ', ' ORDER BY dd.number_payment::text) as numeros_duplicados,
    SUM(dd.registros_a_eliminar) as registros_a_eliminar
FROM duplicates_detail dd
INNER JOIN policy p ON dd.policy_id = p.id
GROUP BY p."number_policy", p.id
ORDER BY registros_a_eliminar DESC, p."number_policy";

-- Copia los números de póliza de esta lista y úsalos uno por uno en fix-duplicates-by-policy.sql
