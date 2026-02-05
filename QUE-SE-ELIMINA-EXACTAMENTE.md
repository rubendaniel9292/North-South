# ❓ ¿QUÉ SE ELIMINA EXACTAMENTE?

## 🎯 CRITERIO DE ELIMINACIÓN

El script **SOLO** elimina pagos que cumplan **AMBAS** condiciones:

1. ✅ Mismo `policy_id` (misma póliza)
2. ✅ Mismo `number_payment` (mismo número de pago)

---

## ✅ SE ELIMINA (Duplicados verdaderos)

### Ejemplo 1: Póliza 65770F - Pago #118 duplicado
```
payment_id | policy_id | number_payment | value  | created_at
51365      | 12345     | 118           | 83.30  | 2026-01-05 00:00:00  ← 🗑️ SE ELIMINA
51366      | 12345     | 118           | 83.30  | 2026-01-05 00:00:01  ← ✅ SE MANTIENE (más reciente)
```
**Razón:** Misma póliza (12345) + mismo número de pago (118) = DUPLICADO

---

## ❌ NO SE ELIMINA (No son duplicados)

### Caso 1: Mismo valor pero diferente número de pago
```
payment_id | policy_id | number_payment | value  
12001      | 12345     | 45            | 83.30  ← ✅ SE MANTIENE
12002      | 12345     | 46            | 83.30  ← ✅ SE MANTIENE
```
**Razón:** Aunque tienen el mismo valor (83.30), son pagos DIFERENTES (#45 y #46)

### Caso 2: Mismo número pero diferente póliza
```
payment_id | policy_id | number_payment | value  
15001      | 12345     | 10            | 100.00 ← ✅ SE MANTIENE
15002      | 67890     | 10            | 150.00 ← ✅ SE MANTIENE
```
**Razón:** Son pagos #10 de PÓLIZAS DIFERENTES (está bien que existan)

### Caso 3: Mismo valor Y mismo número pero diferente póliza
```
payment_id | policy_id | number_payment | value  
20001      | 12345     | 20            | 50.00  ← ✅ SE MANTIENE
20002      | 67890     | 20            | 50.00  ← ✅ SE MANTIENE
```
**Razón:** Son de pólizas diferentes (cada póliza tiene su propio pago #20)

---

## 🔍 QUERY PARA VER EXACTAMENTE QUÉ SE ELIMINARÁ

```sql
-- Ver los pagos que SE ELIMINARÁN (los que NO son el más reciente)
SELECT 
    pr.id as payment_id_a_eliminar,
    p."number_policy" as numero_poliza,
    pr.number_payment as numero_pago,
    pr.value as valor,
    pr.created_at as fecha_creacion,
    '🗑️ SE ELIMINARÁ' as accion
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
WHERE (pr.policy_id, pr.number_payment) IN (
    SELECT policy_id, number_payment
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
)
AND pr.id NOT IN (
    -- Excluir los más recientes (que se mantendrán)
    SELECT MAX(id)
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
)
ORDER BY p."number_policy", pr.number_payment, pr.id;

-- Ver los pagos que SE MANTENDRÁN (los más recientes de cada duplicado)
SELECT 
    pr.id as payment_id_a_mantener,
    p."number_policy" as numero_poliza,
    pr.number_payment as numero_pago,
    pr.value as valor,
    pr.created_at as fecha_creacion,
    '✅ SE MANTIENE (más reciente)' as accion
FROM payment_record pr
INNER JOIN policy p ON pr.policy_id = p.id
WHERE pr.id IN (
    SELECT MAX(id)
    FROM payment_record
    GROUP BY policy_id, number_payment
    HAVING COUNT(*) > 1
)
ORDER BY p."number_policy", pr.number_payment;
```

---

## 📊 RESUMEN

- **Total de pagos actuales:** ~51,500+
- **Pagos duplicados detectados:** 206 registros (84 + 122 = total de duplicados)
- **Registros que se eliminarán:** 122 (los más antiguos de cada duplicado)
- **Registros que se mantendrán:** 84 (los más recientes de cada duplicado)
- **Pagos únicos no afectados:** ~51,400+ (99.7% de la base)

---

## 🎯 CONSTRAINT QUE SE CREARÁ

```sql
UNIQUE (policy_id, number_payment)
```

**Esto significa que en el futuro:**
- ✅ Póliza A puede tener pago #1, #2, #3, etc. (sin duplicar números)
- ✅ Póliza B puede tener pago #1, #2, #3, etc. (cada póliza independiente)
- ❌ Póliza A NO puede tener dos pagos #1 (bloqueado por constraint)
- ✅ Póliza A puede tener múltiples pagos con el mismo valor (si tienen números diferentes)

---

## 💡 CONCLUSIÓN

El script es **seguro y específico**:
- Solo elimina duplicados verdaderos (mismo policy_id + mismo number_payment)
- Mantiene el registro más reciente de cada duplicado
- NO toca pagos con valores repetidos pero números diferentes
- NO toca pagos de pólizas diferentes aunque tengan mismo número
