# Estrategia de Unificación del Sistema de Cache - AG-PYMEs

## 📋 Resumen Ejecutivo

Este documento detalla la estrategia para unificar los tres sistemas de cache actualmente fragmentados en la aplicación AG-PYMEs, consolidándolos en una solución coherente, escalable y mantenible.

### Estado Actual

- **3 implementaciones independientes** de cache con diferentes patrones
- **17% de cobertura** de endpoints con cache (8 de 47 endpoints)
- **Fragmentación** en funcionalidades y configuraciones
- **Duplicación** de lógica y recursos

### Objetivo

Crear un **sistema unificado de cache** que mejore el rendimiento, reduzca la complejidad y facilite el mantenimiento.

---

## 🏗️ Arquitectura del Sistema Unificado

### Componentes Principales

```
📦 UnifiedCacheSystem/
├── 🎯 UnifiedCacheManager.js      # Motor principal de cache
├── 🌐 GlobalCacheProvider.js     # Proveedor de contexto unificado
├──    CacheMetrics.js            # Sistema de métricas integrado
├── ⚙️ CacheConfig.js             # Configuración centralizada
└── 🔧 CacheUtils.js              # Utilidades y helpers
```

### Estrategias de Cache Unificadas

#### 1. **TTL (Time To Live) - Básico**

- Para datos que cambian frecuentemente
- Configuración simple por tipo de dato
- Invalidación automática por tiempo

#### 2. **Bulk Loading - Avanzado**

- Para datos relacionados (appointments, shifts)
- Carga mensual optimizada
- Filtrado inteligente por rangos

#### 3. **Metrics & Performance - Monitoreo**

- Seguimiento de hit/miss ratios
- Análisis de uso y rendimiento
- Alertas de degradación

---

## Análisis de Sistemas Existentes

### Sistema 1: CacheManager (Basic TTL)

**Ubicación:** `utils/cacheManager.js`

```javascript
// Características actuales
- TTL simple con AsyncStorage
- 6 tipos de datos cached
- Invalidación manual por claves
- Sin métricas de rendimiento
```

** Fortalezas:**

- Implementación simple y directa
- Manejo eficiente de AsyncStorage
- Configuración clara por tipo

** Debilidades:**

- Sin optimización para datos relacionados
- No tiene métricas de rendimiento
- Limitado para casos de uso complejos

### Sistema 2: PlannerCacheBulk (Advanced)

**Ubicación:** `context/PlannerCacheBulk.js`

```javascript
// Características actuales
- Bulk loading para appointments/shifts
- Cache mensual optimizado
- Context Provider integrado
- Filtrado inteligente por rangos
```

** Fortalezas:**

- Excelente para datos relacionados
- Optimización de red con bulk loading
- Manejo sofisticado de fechas y rangos
- Métricas básicas incluidas

** Debilidades:**

- Específico solo para planner
- Lógica compleja para casos simples
- No reutilizable para otros módulos

### Sistema 3: useCacheMetrics (Monitoring)

**Ubicación:** `hooks/useCacheMetrics.js`

```javascript
// Características actuales
- Métricas de hit/miss ratio
- Monitoreo de rendimiento
- Análisis de uso por endpoint
- Alertas de degradación
```

** Fortalezas:**

- Excelente sistema de monitoreo
- Métricas detalladas y útiles
- Integración con performance monitoring

** Debilidades:**

- Solo métricas, no implementa cache
- Dependiente de otros sistemas
- No tiene funcionalidad de invalidación

---

## 🎯 Estrategia de Unificación

### Fase 1: Arquitectura Base (Semanas 1-2)

#### 1.1 Crear UnifiedCacheManager

```javascript
// utils/UnifiedCacheManager.js
class UnifiedCacheManager {
  // Combinar mejores características de los 3 sistemas
  // - TTL del CacheManager
  // - Bulk loading del PlannerCacheBulk
  // - Métricas del useCacheMetrics
}
```

#### 1.2 Crear GlobalCacheProvider

```javascript
// context/GlobalCacheProvider.js
export const GlobalCacheProvider = ({ children }) => {
  // Reemplazar múltiples providers por uno unificado
  // Mantener compatibilidad con APIs existentes
};
```

#### 1.3 Configuración Centralizada

```javascript
// config/CacheConfig.js
export const UNIFIED_CACHE_CONFIG = {
  // Consolidar todas las configuraciones
  // TTL, bulk loading, métricas
};
```

### Fase 2: Migración de Servicios (Semanas 3-4)

#### 2.1 Migrar dashboardService.js

- Convertir de CacheManager básico a UnifiedCacheManager
- Implementar métricas automáticas
- Mantener funcionalidad existente

#### 2.2 Migrar alertsService.js

- Similar al dashboard
- Optimizar invalidación de cache
- Añadir bulk loading si es beneficioso

#### 2.3 Migrar PlannerCacheBulk

- Preservar toda la funcionalidad de bulk loading
- Integrar en el sistema unificado
- Mantener optimizaciones existentes

### Fase 3: Expansión y Optimización (Semanas 5-6)

#### 3.1 Implementar Cache en Módulos Sin Cobertura

```javascript
// Módulos objetivo (29 endpoints sin cache):
- employeesService.js (4 endpoints)
- financialServices.js (8 endpoints)
- inventoryService.js (6 endpoints)
- salesService.js (11 endpoints)
```

#### 3.2 Optimizaciones Avanzadas

- Implementar cache inteligente por usuario
- Optimizar estrategias de invalidación
- Añadir preloading predictivo

#### 3.3 Sistema de Métricas Avanzado

- Dashboard de métricas en tiempo real
- Alertas automáticas de rendimiento
- Análisis de patrones de uso

---

## 📁 Decisiones de Archivos

### Archivos a CONSERVAR

```
  context/PlannerCacheBulk.js
   └── Renombrar a: context/LegacyPlannerCache.js
   └── Mantener durante migración gradual

  hooks/useCacheMetrics.js
   └── Integrar funcionalidad en UnifiedCacheManager
   └── Deprecar gradualmente

  components/CacheMetrics.js
   └── Actualizar para usar nuevo sistema
   └── Expandir con nuevas métricas
```

### Archivos a REFACTORIZAR

```
🔄 utils/cacheManager.js
   └── Evolucionar a utils/UnifiedCacheManager.js
   └── Mantener compatibilidad con API existente

🔄 api/services/dashboardService.js
   └── Migrar a nuevo sistema de cache
   └── Implementar métricas automáticas

🔄 api/services/alertsService.js
   └── Similar al dashboard
   └── Optimizar invalidación
```

### Archivos NUEVOS a Crear

```
🆕 context/GlobalCacheProvider.js
   └── Provider unificado principal

🆕 config/CacheConfig.js
   └── Configuración centralizada

🆕 utils/CacheUtils.js
   └── Utilidades compartidas

🆕 components/UnifiedCacheMetrics.js
   └── Dashboard de métricas mejorado

🆕 hooks/useUnifiedCache.js
   └── Hook principal para componentes
```

---

## 🔧 Implementación Técnica Detallada

### UnifiedCacheManager - Arquitectura Core

```javascript
class UnifiedCacheManager {
  constructor(config) {
    this.config = config;
    this.memoryCache = new Map();
    this.metrics = new CacheMetrics();
    this.strategies = {
      ttl: new TTLStrategy(),
      bulk: new BulkLoadingStrategy(),
      intelligent: new IntelligentStrategy(),
    };
  }

  // Método unificado para obtener datos
  async get(key, options = {}) {
    const strategy = this.selectStrategy(options);
    return strategy.get(key, options);
  }

  // Estrategias dinámicas según el tipo de dato
  selectStrategy(options) {
    if (options.bulkLoading) return this.strategies.bulk;
    if (options.intelligent) return this.strategies.intelligent;
    return this.strategies.ttl; // Default
  }

  // Sistema de métricas integrado
  recordMetric(operation, key, hit) {
    this.metrics.record(operation, key, hit);
  }
}
```

### GlobalCacheProvider - Context Unificado

```javascript
export const GlobalCacheProvider = ({ children }) => {
  const cacheManager = useMemo(
    () => new UnifiedCacheManager(UNIFIED_CACHE_CONFIG),
    []
  );

  const value = {
    // API compatible con sistemas existentes
    get: (key, options) => cacheManager.get(key, options),
    set: (key, data, options) => cacheManager.set(key, data, options),
    invalidate: (keys) => cacheManager.invalidate(keys),

    // APIs específicas para compatibilidad
    getEmployees: (refresh) =>
      cacheManager.get("employees", {
        strategy: "ttl",
        forceRefresh: refresh,
      }),

    getAppointmentsMonthly: (date, refresh) =>
      cacheManager.get(`appointments_monthly_${getMonthKey(date)}`, {
        strategy: "bulk",
        forceRefresh: refresh,
        bulkLoading: true,
        dateRange: getMonthRange(date),
      }),

    // Métricas unificadas
    getMetrics: () => cacheManager.getMetrics(),
    getCacheStatus: () => cacheManager.getStatus(),
  };

  return (
    <CacheContext.Provider value={value}>{children}</CacheContext.Provider>
  );
};
```

---

## 📈 Plan de Migración por Fases

### Semana 1: Fundación

**Objetivos:**

- [ ] Crear arquitectura base del UnifiedCacheManager
- [ ] Implementar configuración centralizada
- [ ] Crear tests unitarios básicos

**Entregables:**

- `utils/UnifiedCacheManager.js` (funcional básico)
- `config/CacheConfig.js` (configuración completa)
- Tests unitarios (>80% coverage)

### Semana 2: Provider Unificado

**Objetivos:**

- [ ] Implementar GlobalCacheProvider
- [ ] Crear hooks de compatibilidad
- [ ] Preparar sistema de métricas

**Entregables:**

- `context/GlobalCacheProvider.js` (completo)
- `hooks/useUnifiedCache.js` (funcional)
- Sistema de métricas integrado

### Semana 3: Primera Migración

**Objetivos:**

- [ ] Migrar dashboardService.js al nuevo sistema
- [ ] Mantener funcionalidad exacta
- [ ] Implementar métricas automáticas

**Entregables:**

- dashboardService.js migrado y testeado
- Métricas de rendimiento comparativas
- Documentación de migración

### Semana 4: Segunda Migración

**Objetivos:**

- [ ] Migrar alertsService.js
- [ ] Refinar el proceso de migración
- [ ] Optimizar configuraciones

**Entregables:**

- alertsService.js migrado
- Proceso de migración documentado
- Optimizaciones de rendimiento

### Semana 5: Migración Compleja

**Objetivos:**

- [ ] Migrar PlannerCacheBulk manteniendo toda funcionalidad
- [ ] Preservar optimizaciones de bulk loading
- [ ] Integrar métricas avanzadas

**Entregables:**

- Sistema de planner completamente migrado
- Bulk loading optimizado en sistema unificado
- Métricas de rendimiento mejoradas

### Semana 6: Expansión y Finalización

**Objetivos:**

- [ ] Implementar cache en módulos restantes
- [ ] Crear dashboard de métricas
- [ ] Documentación completa

**Entregables:**

- 100% de endpoints con cache inteligente
- Dashboard de métricas en tiempo real
- Documentación completa del sistema

---

## 🎯 Configuración Unificada

### CacheConfig.js - Configuración Central

```javascript
export const UNIFIED_CACHE_CONFIG = {
  // Configuración global
  DEFAULT_TTL: 10 * 60 * 1000, // 10 minutos
  MAX_MEMORY_SIZE: 50 * 1024 * 1024, // 50MB
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutos

  // Estrategias por tipo de dato
  DATA_TYPES: {
    // Datos maestros - TTL largo
    MASTER_DATA: {
      employees: { ttl: 30 * 60 * 1000, strategy: "ttl" },
      services: { ttl: 30 * 60 * 1000, strategy: "ttl" },
      clients: { ttl: 15 * 60 * 1000, strategy: "ttl" },
      settings: { ttl: 60 * 60 * 1000, strategy: "ttl" },
    },

    // Datos relacionales - Bulk loading
    RELATIONAL_DATA: {
      appointments: {
        ttl: 10 * 60 * 1000,
        strategy: "bulk",
        bulkSize: "monthly",
        preload: true,
      },
      shifts: {
        ttl: 15 * 60 * 1000,
        strategy: "bulk",
        bulkSize: "monthly",
        preload: true,
      },
    },

    // Datos transaccionales - TTL corto
    TRANSACTIONAL_DATA: {
      dashboard: { ttl: 5 * 60 * 1000, strategy: "ttl" },
      alerts: { ttl: 2 * 60 * 1000, strategy: "ttl" },
      sales: { ttl: 5 * 60 * 1000, strategy: "intelligent" },
      inventory: { ttl: 10 * 60 * 1000, strategy: "intelligent" },
    },
  },

  // Configuración de métricas
  METRICS: {
    enabled: true,
    sampleRate: 1.0, // 100% de operaciones
    alertThresholds: {
      hitRatio: 0.7, // Alert si hit ratio < 70%
      responseTime: 1000, // Alert si > 1s
      errorRate: 0.05, // Alert si error rate > 5%
    },
  },
};
```

---

## Métricas y Monitoreo

### Sistema de Métricas Unificado

```javascript
class CacheMetrics {
  constructor() {
    this.metrics = {
      operations: new Map(),
      hitRatio: 0,
      totalHits: 0,
      totalMisses: 0,
      averageResponseTime: 0,
      errorRate: 0,
    };
  }

  record(operation, key, result) {
    // Registrar métricas por operación
    if (!this.metrics.operations.has(operation)) {
      this.metrics.operations.set(operation, {
        hits: 0,
        misses: 0,
        errors: 0,
        responseTimes: [],
      });
    }

    const opMetrics = this.metrics.operations.get(operation);

    if (result.hit) {
      opMetrics.hits++;
      this.metrics.totalHits++;
    } else {
      opMetrics.misses++;
      this.metrics.totalMisses++;
    }

    opMetrics.responseTimes.push(result.responseTime);

    // Calcular métricas agregadas
    this.updateAggregateMetrics();
  }

  getReport() {
    return {
      overview: {
        hitRatio: this.metrics.hitRatio,
        totalOperations: this.metrics.totalHits + this.metrics.totalMisses,
        averageResponseTime: this.metrics.averageResponseTime,
        errorRate: this.metrics.errorRate,
      },
      byOperation: Array.from(this.metrics.operations.entries()).map(
        ([operation, metrics]) => ({
          operation,
          hitRatio: metrics.hits / (metrics.hits + metrics.misses),
          averageResponseTime:
            metrics.responseTimes.reduce((a, b) => a + b, 0) /
            metrics.responseTimes.length,
          totalOperations: metrics.hits + metrics.misses,
        })
      ),
    };
  }
}
```

---

## 🚀 Beneficios Esperados

### Rendimiento

- **↑ 40%** mejora en tiempo de respuesta promedio
- **↑ 60%** reducción en llamadas a API redundantes
- **↓ 50%** reducción en uso de red

### Mantenabilidad

- **1 sistema unificado** en lugar de 3 fragmentados
- **Configuración centralizada** para todos los módulos
- **API consistente** en toda la aplicación

### Escalabilidad

- **Soporte para nuevos módulos** sin duplicar código
- **Estrategias de cache inteligentes** adaptables
- **Sistema de métricas** para optimización continua

### Experiencia de Usuario

- **↓ 70%** en tiempos de carga inicial
- **Navegación más fluida** entre secciones
- **Datos siempre actualizados** con invalidación inteligente

---

## 🔍 Criterios de Éxito

### Métricas Técnicas

- [ ] **Hit Ratio > 80%** en promedio
- [ ] **Tiempo de respuesta < 100ms** para datos cached
- [ ] **0 regresiones** en funcionalidad existente
- [ ] **Cobertura de tests > 90%**

### Métricas de Desarrollo

- [ ] **↓ 60%** líneas de código relacionadas con cache
- [ ] **1 API unificada** para todos los casos de uso
- [ ] **Documentación completa** del sistema

### Métricas de Usuario

- [ ] **↓ 50%** tiempo de carga inicial
- [ ] **↑ 90%** satisfacción con velocidad de respuesta
- [ ] **0 errores** relacionados con cache

---

## 📚 Documentación y Recursos

### Documentos de Referencia

- `docs/Cache_Navigation_Analysis.md` - Análisis actual del sistema
- `docs/Performance_Analysis_Report.md` - Métricas de rendimiento
- `docs/Propuestas_Mejora_Completas.md` - Propuestas de optimización

### APIs de Referencia

- [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)
- [React Context API](https://reactjs.org/docs/context.html)
- [Performance Monitoring Best Practices](https://web.dev/performance/)

### Testing Strategy

```javascript
// Estructura de tests
__tests__/
├── UnifiedCacheManager.test.js
├── GlobalCacheProvider.test.js
├── CacheStrategies.test.js
├── CacheMetrics.test.js
└── integration/
    ├── MigrationCompatibility.test.js
    └── PerformanceRegression.test.js
```

---

## 🎯 Próximos Pasos Inmediatos

### Esta Semana (Semana 1)

1. **Crear branch de desarrollo** `feature/unified-cache-system`
2. **Implementar UnifiedCacheManager básico** con TTL strategy
3. **Configurar tests unitarios** con Jest
4. **Crear CacheConfig.js** con configuración inicial

### Próxima Semana (Semana 2)

1. **Implementar GlobalCacheProvider** con API básica
2. **Crear hooks de compatibilidad** para migración gradual
3. **Integrar sistema de métricas** básico
4. **Preparar documentación** de APIs

---

_Documento creado el 29 de julio de 2025_  
_Última actualización: 29 de julio de 2025_  
_Versión: 1.0_
