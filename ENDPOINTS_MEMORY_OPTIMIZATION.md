# 🚀 Guía de Endpoints Optimizados para Evitar Memory Leak

## 🔴 PROBLEMA IDENTIFICADO
Los endpoints originales `get-all-customer` y `get-all-policy` estaban causando **JavaScript heap out of memory** en producción al cargar relaciones masivas:

- `getAllCustomers()` carga relación `'policies'` para TODOS los clientes
- `getAllPolicies()` carga relaciones `'payments'`, `'payments.paymentStatus'`, `'renewals'`, etc.

## ✅ SOLUCIÓN IMPLEMENTADA

### 📋 ENDPOINTS DISPONIBLES

#### **CLIENTES**

| Endpoint | Uso Recomendado | Relaciones | Memory Impact |
|----------|----------------|------------|---------------|
| `GET /customers/get-all-customer` | ❌ **EVITAR** - Solo casos específicos | Incluye `policies` | **ALTO** - Puede causar memory leak |
| `GET /customers/get-all-customer-optimized` | ✅ **USAR** - Listados generales | Sin `policies` | **BAJO** - Seguro |
| `GET /customers/get-all-customer-paginated` | 🏆 **RECOMENDADO** - Mejor opción | Sin `policies` + Paginación | **MÍNIMO** - Máximo control |

#### **POLIZAS**

| Endpoint | Uso Recomendado | Relaciones | Memory Impact |
|----------|----------------|------------|---------------|
| `GET /policy/get-all-policy` | ❌ **EVITAR** - Solo casos específicos | Incluye `payments`, `renewals` | **ALTO** - Puede causar memory leak |
| `GET /policy/get-all-policy-optimized` | ✅ **USAR** - Listados generales | Sin `payments`, `renewals` | **BAJO** - Seguro |
| `GET /policy/get-all-policy-paginated` | 🏆 **RECOMENDADO** - Mejor opción | Sin `payments` + Paginación | **MÍNIMO** - Máximo control |

## 🎯 RECOMENDACIONES PARA EL FRONTEND

### 1. **Para Listados/Tablas Generales (USAR SIEMPRE):**
```javascript
// ✅ CORRECTO - Evita memory leak
fetch('/customers/get-all-customer-optimized')
fetch('/policy/get-all-policy-optimized')

// 🏆 MEJOR - Con paginación
fetch('/customers/get-all-customer-paginated?page=1&limit=50')
fetch('/policy/get-all-policy-paginated?page=1&limit=50')
```

### 2. **Para Casos Específicos (SOLO CUANDO SEA NECESARIO):**
```javascript
// ⚠️ USAR CON PRECAUCIÓN - Solo cuando necesites las relaciones completas
fetch('/customers/get-all-customer') // Solo si necesitas policies del cliente
fetch('/policy/get-all-policy')     // Solo si necesitas payments de la política
```

## 📄 PARÁMETROS DE PAGINACIÓN

### Clientes Paginados: `/customers/get-all-customer-paginated`
```
?page=1           // Página (default: 1)
&limit=50         // Registros por página (default: 50, max: 100)
&search=Juan      // Búsqueda opcional
```

### Políticas Paginadas: `/policy/get-all-policy-paginated`
```
?page=1           // Página (default: 1)
&limit=50         // Registros por página (default: 50, max: 100)
&search=POL001    // Búsqueda por número de póliza
```

## 📊 RESPUESTA DE ENDPOINTS PAGINADOS

```json
{
  "status": "success",
  "customers": [...],  // o "policies": [...]
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 230,
    "limit": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "message": "Lista paginada optimizada - RECOMENDADO para evitar memory leak"
}
```

## 🔧 OPTIMIZACIONES IMPLEMENTADAS

### 1. **Eliminación de Relaciones Pesadas**
- ❌ Clientes optimizados: SIN relación `'policies'`
- ❌ Políticas optimizadas: SIN `'payments'`, `'payments.paymentStatus'`, `'renewals'`, `'commissionRefunds'`, `'periods'`

### 2. **Cache Inteligente**
- Cache separado para versiones optimizadas
- TTL reducido (4 horas vs 9 horas originales)
- Cache específico por página en versiones paginadas

### 3. **Límites de Seguridad**
- Máximo 100 registros por página en paginación
- Control automático de límites excesivos

## 🚨 MIGRACION DEL FRONTEND

### Cambios Urgentes Requeridos:

1. **Cambiar llamadas a endpoints problemáticos:**
   ```javascript
   // ❌ CAMBIAR ESTO:
   fetch('/customers/get-all-customer')
   fetch('/policy/get-all-policy')
   
   // ✅ POR ESTO:
   fetch('/customers/get-all-customer-paginated?page=1&limit=50')
   fetch('/policy/get-all-policy-paginated?page=1&limit=50')
   ```

2. **Implementar paginación en UI:**
   - Agregar controles de paginación
   - Manejar respuesta con estructura `pagination`

3. **Casos especiales:**
   - Si necesitas datos completos de UN cliente específico: usar `/customers/get-customer-id/:id`
   - Si necesitas datos completos de UNA póliza específica: usar `/policy/get-policy-id/:id`

## 📈 BENEFICIOS

- ✅ **Eliminación de memory leaks** en producción
- ✅ **Respuesta más rápida** del API
- ✅ **Menor uso de Redis** con cache optimizado
- ✅ **Escalabilidad mejorada** con paginación
- ✅ **Compatibilidad backward** - endpoints originales siguen disponibles

## ⚠️ IMPORTANTE

**NO USAR los endpoints originales** para listados generales hasta que el frontend sea migrado completamente. Solo usar endpoints optimizados o paginados para evitar que vuelva a ocurrir el memory leak en producción.