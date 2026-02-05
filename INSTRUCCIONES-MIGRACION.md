# 🚀 Instrucciones para Aplicar la Migración de Pagos Duplicados

## ⚠️ IMPORTANTE: Leer antes de ejecutar

Esta migración eliminará **122 registros duplicados** de 53 pólizas afectadas.

---

## 📋 PASO 1: BACKUP (OBLIGATORIO)

Antes de ejecutar cualquier cambio, haz un respaldo de la tabla `payment_record`:

```bash
# Opción A: Backup completo de la tabla
pg_dump -U postgres -d insurance_db -t payment_record > backup_payment_record_$(date +%Y%m%d_%H%M%S).sql

# Opción B: Backup solo de duplicados (más ligero)
psql -U postgres -d insurance_db -c "COPY (
    SELECT pr.* 
    FROM payment_record pr
    WHERE (pr.policy_id, pr.number_payment) IN (
        SELECT policy_id, number_payment
        FROM payment_record
        GROUP BY policy_id, number_payment
        HAVING COUNT(*) > 1
    )
) TO '/tmp/backup_duplicados_$(date +%Y%m%d_%H%M%S).csv' WITH CSV HEADER;"
```

---

## 🔧 PASO 2: EJECUTAR LA MIGRACIÓN

Una vez tengas el backup, ejecuta el script:

```bash
psql -U postgres -d insurance_db -f /home/rubendaniel/project-north-south/api-north-south/fix-duplicate-payments.sql
```

**Resultado esperado:**
```
DELETE 122
ALTER TABLE
constraint_name | constraint_type | constraint_definition
unique_payment_number_per_policy | u | UNIQUE (policy_id, number_payment)
```

---

## ✅ PASO 3: VERIFICAR LA MIGRACIÓN

Después de ejecutar, verifica que no queden duplicados:

```sql
-- Debe retornar 0 filas (sin duplicados)
SELECT policy_id, number_payment, COUNT(*) as duplicates
FROM payment_record
GROUP BY policy_id, number_payment
HAVING COUNT(*) > 1;
```

---

## 🔄 PASO 4: REINICIAR EL SERVIDOR

El código en `payment.service.ts` ya tiene la validación triple-capa implementada.
Reinicia el servidor NestJS para que tome efecto:

```bash
# Si usas PM2
pm2 restart api-north-south

# Si usas npm/yarn directamente
# Detener con Ctrl+C y reiniciar
npm run start:dev
```

---

## 🧪 PASO 5: PROBAR LA PROTECCIÓN

Intenta crear un pago duplicado manualmente para confirmar que el constraint funciona:

```sql
-- Intenta duplicar un pago existente (debe fallar con error de constraint)
INSERT INTO payment_record (policy_id, number_payment, value, pending_value, status_payment_id, created_at)
VALUES (
    (SELECT id FROM policy WHERE "number_policy" = '65770F'),
    118,  -- Número que ya existe
    83.30,
    0,
    1,
    NOW()
);
-- Resultado esperado: ERROR: duplicate key value violates unique constraint "unique_payment_number_per_policy"
```

---

## 📊 PASO 6: MONITOREAR EL SCHEDULER

Espera a la siguiente ejecución del scheduler (medianoche Ecuador) o ejecútalo manualmente.

**En los logs debes ver:**
- ✅ Sin errores de duplicados
- ✅ Si intenta crear duplicado: `⚠️ [DUPLICADO DETECTADO] Ya existe pago #...`
- ✅ El scheduler continúa sin errores

---

## 🆘 ROLLBACK (si algo sale mal)

Si necesitas revertir los cambios:

```sql
-- 1. Eliminar el constraint
ALTER TABLE payment_record DROP CONSTRAINT IF EXISTS unique_payment_number_per_policy;

-- 2. Restaurar el backup
psql -U postgres -d insurance_db < backup_payment_record_YYYYMMDD_HHMMSS.sql
```

---

## 📝 RESUMEN DE CAMBIOS

### Base de datos:
- ✅ Eliminados 122 registros duplicados (se mantiene el más reciente por cada duplicado)
- ✅ Constraint UNIQUE en `(policy_id, number_payment)` - previene duplicados a nivel de BD

### Código (ya implementado en payment.service.ts):
- ✅ **Capa 1:** Pre-validación antes de guardar (recarga desde BD, no desde caché)
- ✅ **Capa 2:** Constraint de base de datos (bloquea a nivel PostgreSQL)
- ✅ **Capa 3:** Manejo de errores de constraint (retorna existente en vez de fallar)

---

## ✨ RESULTADO FINAL

- ✅ Imposible crear pagos duplicados (BD + código)
- ✅ Scheduler puede ejecutarse concurrentemente sin problemas
- ✅ Si hay race condition, se detecta y se maneja gracefully
- ✅ Logs claros cuando se detecta intento de duplicado
