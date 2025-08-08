# 🏢 Roadmap Multi-Tenancy AG-PYMEs - Express + PostgreSQL + React Native

> **Proyecto:** AG-PYMEs Multi-Tenancy Implementation  
> **Stack:** Express.js + PostgreSQL + React Native  
> **Fecha Inicio:** 9 de agosto de 2025  
> **Duración Estimada:** 6-8 semanas

## 📋 Resumen Ejecutivo

Este roadmap detalla la implementación de un sistema **multi-tenancy robusto** para AG-PYMEs utilizando el stack actual (Express.js, PostgreSQL, React Native), adaptando los conceptos del sistema Supabase documentado a una arquitectura self-hosted.

### 🎯 Objetivos Principales

1. **Aislamiento Completo de Datos** por empresa usando Row Level Security (RLS)
2. **Sistema de Autenticación Multi-Tenant** con JWT personalizado
3. **Gestión de Planes y Límites** por empresa
4. **Contexto de Empresa** en Frontend React Native
5. **API Multi-Tenant** en Express.js con middleware centralizado

---

## 🏗️ Arquitectura Objetivo

### Modelo Multi-Tenancy

- **Estrategia:** Shared Database, Shared Schema, Isolated Rows
- **Identificador Tenant:** `company_id` (UUID)
- **Aislamiento:** Row Level Security (RLS) + JWT Claims
- **Autenticación:** JWT con metadatos de empresa

### Stack Tecnológico

- **Backend:** Express.js + PostgreSQL + JWT
- **Frontend:** React Native + Context API
- **Base de Datos:** PostgreSQL con RLS nativo
- **Middleware:** Tenant Context personalizado

---

# 📅 FASES DE IMPLEMENTACIÓN

## 🔷 FASE 1: Preparación de Base de Datos (Semana 1)

### 📝 **Tarea 1.1: Crear tabla companies**

**Duración:** 1 día  
**Prioridad:** Alta

```sql
-- Crear tabla principal de empresas
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  company_code VARCHAR(50) NOT NULL UNIQUE,
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'basic',
  max_users INTEGER NOT NULL DEFAULT 5,
  max_clients INTEGER NOT NULL DEFAULT 100,
  max_products INTEGER NOT NULL DEFAULT 500,
  max_storage_mb INTEGER NOT NULL DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Artefactos:**

- Script SQL: `scripts/database/01_create_companies.sql`

---

### 📝 **Tarea 1.2: Modificar tabla users para multi-tenancy**

**Duración:** 1 día  
**Prioridad:** Alta

```sql
-- Agregar company_id a usuarios existentes
ALTER TABLE users
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Crear índice para optimizar queries
CREATE INDEX idx_users_company_id ON users(company_id);

-- Migrar usuarios existentes a una empresa por defecto
```

**Artefactos:**

- Script SQL: `scripts/database/02_migrate_users_multitenancy.sql`
- Script migración datos: `scripts/database/02_migrate_existing_users.sql`

---

### 📝 **Tarea 1.3: Agregar company_id a todas las tablas operacionales**

**Duración:** 2 días  
**Prioridad:** Alta

**Tablas a modificar (24 total):**

- `alerts`, `appointments`, `clients`, `employees`, `expenses`
- `income`, `inventory`, `sales`, `services`, `suppliers`
- `settings`, `orders`, `leaves`, `shifts`, etc.

```sql
-- Patrón para cada tabla
ALTER TABLE [tabla_name]
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

CREATE INDEX idx_[tabla_name]_company_id ON [tabla_name](company_id);
```

**Artefactos:**

- Script SQL: `scripts/database/03_add_company_id_all_tables.sql`
- Script migración: `scripts/database/03_migrate_existing_data.sql`

---

### 📝 **Tarea 1.4: Implementar Row Level Security (RLS)**

**Duración:** 1 día  
**Prioridad:** Alta

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE [tabla_name] ENABLE ROW LEVEL SECURITY;

-- Crear políticas uniformes
CREATE POLICY "tenant_isolation" ON [tabla_name]
FOR ALL USING (company_id = current_setting('app.current_company_id')::uuid);

-- Política especial para tabla companies
CREATE POLICY "company_owner" ON companies
FOR ALL USING (id = current_setting('app.current_company_id')::uuid);
```

**Artefactos:**

- Script SQL: `scripts/database/04_enable_rls.sql`
- Script políticas: `scripts/database/04_create_rls_policies.sql`

---

### 📝 **Tarea 1.5: Crear funciones de utilidad para límites**

**Duración:** 1 día  
**Prioridad:** Media

```sql
-- Función para obtener estadísticas de uso
CREATE FUNCTION get_company_usage_stats(company_uuid UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'users', (SELECT COUNT(*) FROM users WHERE company_id = company_uuid),
    'clients', (SELECT COUNT(*) FROM clients WHERE company_id = company_uuid),
    'products', (SELECT COUNT(*) FROM inventory WHERE company_id = company_uuid)
  );
$$ LANGUAGE SQL;

-- Función para validar límites
CREATE FUNCTION check_company_limits(company_uuid UUID, resource_type TEXT)
RETURNS BOOLEAN AS $$ -- Implementación de lógica de validación $$ LANGUAGE PLPGSQL;
```

**Artefactos:**

- Script SQL: `scripts/database/05_utility_functions.sql`

---

## 🔷 FASE 2: Backend Multi-Tenant (Semana 2-3)

### 📝 **Tarea 2.1: Crear middleware tenant-context**

**Duración:** 2 días  
**Prioridad:** Alta

```javascript
// middleware/tenantContext.js
const tenantContext = (req, res, next) => {
  const companyId = req.user?.company_id;
  if (!companyId) {
    return res.status(401).json({ error: "Company context required" });
  }

  // Establecer contexto de tenant en PostgreSQL
  req.db.query("SET app.current_company_id = $1", [companyId]);
  req.companyId = companyId;
  next();
};
```

**Artefactos:**

- `backend/middleware/tenantContext.js`
- `backend/middleware/index.js` (centralizado)

---

### 📝 **Tarea 2.2: Actualizar sistema de autenticación JWT**

**Duración:** 2 días  
**Prioridad:** Alta

```javascript
// Modificar loginController.js para incluir company_id
const payload = {
  id_usuario: user.id_usuario,
  email: user.email,
  nombre: user.nombre,
  company_id: user.company_id, // ← NUEVO
  role: user.rol,
};
```

**Artefactos:**

- `backend/controllers/loginController.js` (modificado)
- `backend/middleware/verifyToken.js` (actualizado)
- `backend/controllers/authController.js` (nuevo)

---

### 📝 **Tarea 2.3: Crear controlador de empresas**

**Duración:** 2 días  
**Prioridad:** Alta

```javascript
// controllers/companiesController.js
const getCompanyData = async (req, res) => {
  const companyId = req.companyId;
  // Implementar lógica
};

const getCompanyUsage = async (req, res) => {
  const companyId = req.companyId;
  // Usar función de DB get_company_usage_stats
};
```

**Endpoints a implementar:**

- `GET /api/companies/current` - Datos empresa actual
- `GET /api/companies/usage` - Estadísticas de uso
- `GET /api/companies/limits` - Límites del plan
- `PUT /api/companies/settings` - Actualizar configuración
- `POST /api/companies/validate-limit` - Validar límites

**Artefactos:**

- `backend/controllers/companiesController.js`
- `backend/routes/companiesRoutes.js`

---

### 📝 **Tarea 2.4: Actualizar todos los controladores existentes**

**Duración:** 3 días  
**Prioridad:** Alta

**Modificaciones por controlador:**

1. Agregar middleware `tenantContext`
2. Usar `req.companyId` en queries
3. Incluir `company_id` en INSERTs
4. Validar límites antes de crear recursos

**Patrón de actualización:**

```javascript
// Antes
const result = await pool.query("SELECT * FROM clients");

// Después
const result = await pool.query("SELECT * FROM clients WHERE company_id = $1", [
  req.companyId,
]);
```

**Artefactos:**

- 20+ controladores actualizados
- Tests unitarios por controlador

---

### 📝 **Tarea 2.5: Sistema de invitaciones**

**Duración:** 2 días  
**Prioridad:** Media

```sql
-- Tabla de invitaciones
CREATE TABLE company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  invitation_code VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  invited_email VARCHAR(255),
  created_by_user_id UUID,
  used_by_user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Artefactos:**

- Script SQL: `scripts/database/06_company_invitations.sql`
- `backend/controllers/invitationsController.js`
- `backend/routes/invitationsRoutes.js`

---

## 🔷 FASE 3: Frontend Multi-Tenant (Semana 4)

### 📝 **Tarea 3.1: Crear CompanyContext**

**Duración:** 1 día  
**Prioridad:** Alta

```javascript
// context/CompanyContext.js
const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [usage, setUsage] = useState({});
  const [limitsStatus, setLimitsStatus] = useState({});

  const checkLimit = async (resource, quantity = 1) => {
    // Implementar validación de límites
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        usage,
        limitsStatus,
        checkLimit,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
```

**Artefactos:**

- `AG-PYMEs/context/CompanyContext.js`
- `AG-PYMEs/hooks/useCompany.js`

---

### 📝 **Tarea 3.2: Actualizar AuthContext con company_id**

**Duración:** 1 día  
**Prioridad:** Alta

```javascript
// Modificar AuthContext para manejar company_id
const [user, setUser] = useState({
  id: null,
  email: null,
  company_id: null, // ← NUEVO
  role: null,
});
```

**Artefactos:**

- `AG-PYMEs/context/AuthContext.js` (modificado)

---

### 📝 **Tarea 3.3: Crear servicios API multi-tenant**

**Duración:** 2 días  
**Prioridad:** Alta

```javascript
// api/services/CompanyService.js
export const CompanyService = {
  getCurrentCompany: async () => {
    return await http.get("/companies/current");
  },

  getUsageStats: async () => {
    return await http.get("/companies/usage");
  },

  checkLimit: async (resource, quantity) => {
    return await http.post("/companies/validate-limit", { resource, quantity });
  },
};
```

**Artefactos:**

- `AG-PYMEs/api/services/CompanyService.js`
- `AG-PYMEs/api/services/index.js` (actualizado)

---

### 📝 **Tarea 3.4: Crear componentes de gestión de empresa**

**Duración:** 2 días  
**Prioridad:** Media

**Componentes a crear:**

- `CompanySettings` - Configuración de empresa
- `UsageStats` - Estadísticas de uso
- `LimitsWarning` - Avisos de límites
- `InviteUsers` - Invitar usuarios

**Artefactos:**

- `AG-PYMEs/components/company/CompanySettings.js`
- `AG-PYMEs/components/company/UsageStats.js`
- `AG-PYMEs/components/company/LimitsWarning.js`
- `AG-PYMEs/components/company/InviteUsers.js`

---

### 📝 **Tarea 3.5: Actualizar pantallas existentes con validación de límites**

**Duración:** 2 días  
**Prioridad:** Alta

**Pantallas a modificar:**

- Crear cliente: Validar límite de clientes
- Crear producto: Validar límite de productos
- Invitar usuario: Validar límite de usuarios

```javascript
// Ejemplo en pantalla de crear cliente
const handleCreateClient = async () => {
  const canAdd = await company.checkLimit("clients", 1);
  if (!canAdd) {
    Alert.alert("Límite alcanzado", "Has alcanzado el límite de clientes");
    return;
  }
  // Continuar con creación
};
```

**Artefactos:**

- Pantallas actualizadas con validación
- Componentes de alerta por límites

---

## 🔷 FASE 4: Sistema de Planes y Límites (Semana 5)

### 📝 **Tarea 4.1: Definir planes de suscripción**

**Duración:** 1 día  
**Prioridad:** Alta

```sql
-- Insertar planes predefinidos
INSERT INTO companies (company_name, company_code, subscription_plan, max_users, max_clients, max_products, max_storage_mb)
VALUES
  ('Demo Basic', 'DEMO_BASIC', 'basic', 5, 100, 500, 1000),
  ('Demo Pro', 'DEMO_PRO', 'pro', 20, 500, 2000, 5000),
  ('Demo Enterprise', 'DEMO_ENT', 'enterprise', 100, 2000, 10000, 20000);
```

**Planes definidos:**
| Plan | Usuarios | Clientes | Productos | Almacenamiento |
|------------|----------|----------|-----------|----------------|
| Basic | 5 | 100 | 500 | 1 GB |
| Pro | 20 | 500 | 2000 | 5 GB |
| Enterprise | 100 | 2000 | 10000 | 20 GB |

**Artefactos:**

- Script SQL: `scripts/database/07_subscription_plans.sql`
- Documentación de planes: `docs/Subscription_Plans.md`

---

### 📝 **Tarea 4.2: Implementar validación de límites en backend**

**Duración:** 2 días  
**Prioridad:** Alta

```javascript
// middleware/validateLimits.js
const validateLimit = (resource) => {
  return async (req, res, next) => {
    const canCreate = await checkCompanyLimit(req.companyId, resource);
    if (!canCreate) {
      return res.status(403).json({
        error: `Límite de ${resource} alcanzado`,
      });
    }
    next();
  };
};
```

**Artefactos:**

- `backend/middleware/validateLimits.js`
- `backend/utils/limitsChecker.js`

---

### 📝 **Tarea 4.3: Dashboard de administración**

**Duración:** 2 días  
**Prioridad:** Media

```javascript
// Endpoint para dashboard de empresa
const getDashboardStats = async (req, res) => {
  const companyId = req.companyId;
  const stats = await pool.query(
    `
    SELECT get_company_usage_stats($1) as usage_stats
  `,
    [companyId]
  );

  res.json(stats.rows[0]);
};
```

**Métricas del dashboard:**

- Usuarios activos
- Clientes registrados
- Productos en inventario
- Ventas del mes
- Consumo de almacenamiento

**Artefactos:**

- `backend/controllers/dashboardController.js` (actualizado)
- `AG-PYMEs/screens/dashboard/CompanyDashboard.js`

---

## 🔷 FASE 5: Testing y Migración de Datos (Semana 6)

### 📝 **Tarea 5.1: Scripts de migración de datos existentes**

**Duración:** 2 días  
**Prioridad:** Alta

```sql
-- Crear empresa por defecto para datos existentes
INSERT INTO companies (id, company_name, company_code, subscription_plan)
VALUES (gen_random_uuid(), 'Empresa Migrada', 'LEGACY_001', 'pro');

-- Asignar todos los datos existentes a esta empresa
UPDATE users SET company_id = (SELECT id FROM companies WHERE company_code = 'LEGACY_001');
UPDATE clients SET company_id = (SELECT id FROM companies WHERE company_code = 'LEGACY_001');
-- ... resto de tablas
```

**Artefactos:**

- `scripts/migration/migrate_existing_data.sql`
- `scripts/migration/rollback_migration.sql`

---

### 📝 **Tarea 5.2: Tests de aislamiento de datos**

**Duración:** 2 días  
**Prioridad:** Alta

```javascript
// tests/multitenancy/isolation.test.js
describe("Multi-tenancy Data Isolation", () => {
  test("Company A cannot see Company B data", async () => {
    // Crear dos empresas con datos
    // Verificar que no hay filtración de datos
  });
});
```

**Tests a implementar:**

- Aislamiento de datos entre empresas
- Validación de límites por plan
- Autenticación multi-tenant
- Políticas RLS funcionando

**Artefactos:**

- `tests/multitenancy/` (suite completa)
- `tests/integration/` (tests E2E)

---

### 📝 **Tarea 5.3: Documentación técnica**

**Duración:** 1 día  
**Prioridad:** Media

**Documentos a crear:**

- Guía de migración para empresas existentes
- Manual de configuración multi-tenant
- Guía de troubleshooting
- API Reference actualizada

**Artefactos:**

- `docs/Multi_Tenant_Migration_Guide.md`
- `docs/API_Reference_MultiTenant.md`
- `docs/Troubleshooting_MultiTenant.md`

---

## 🔷 FASE 6: Optimización y Deploy (Semana 7-8)

### 📝 **Tarea 6.1: Optimización de performance**

**Duración:** 2 días  
**Prioridad:** Media

```sql
-- Índices optimizados para multi-tenancy
CREATE INDEX CONCURRENTLY idx_clients_company_lookup ON clients(company_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_inventory_company_active ON inventory(company_id) WHERE active = true;

-- Análisis de queries lentas
EXPLAIN ANALYZE SELECT * FROM clients WHERE company_id = $1;
```

**Optimizaciones:**

- Índices compuestos con `company_id`
- Query optimization para RLS
- Cache de datos de empresa
- Connection pooling optimizado

**Artefactos:**

- `scripts/performance/optimize_indexes.sql`
- `docs/Performance_Analysis_MultiTenant.md`

---

### 📝 **Tarea 6.2: Monitoring y observabilidad**

**Duración:** 2 días  
**Prioridad:** Media

```javascript
// middleware/monitoring.js
const logTenantActivity = (req, res, next) => {
  console.log(`[${req.companyId}] ${req.method} ${req.path}`);
  // Log a sistema de monitoreo
  next();
};
```

**Métricas a monitorear:**

- Requests por empresa
- Tiempo de respuesta por tenant
- Uso de recursos por empresa
- Errores de aislamiento

**Artefactos:**

- `backend/middleware/monitoring.js`
- `backend/utils/metricsCollector.js`

---

### 📝 **Tarea 6.3: Preparación para Render/Neon**

**Duración:** 2 días  
**Prioridad:** Alta

**Configuraciones específicas:**

- Variables de entorno para multi-tenancy
- Scripts de deploy con migración
- Health checks multi-tenant
- Configuración de conexiones DB

```bash
# scripts/deploy/deploy_multitenancy.sh
#!/bin/bash
echo "Deploying multi-tenant AG-PYMEs..."
npm run migrate:multitenancy
npm run seed:companies
npm start
```

**Artefactos:**

- `scripts/deploy/deploy_multitenancy.sh`
- `.env.multitenancy.example`
- `docs/Deploy_Guide_Render_Neon.md`

---

# 📊 PLAN DE VALIDACIÓN

## 🧪 Tests Críticos

### **Test 1: Aislamiento de Datos**

```sql
-- Verificar que RLS funciona correctamente
SET app.current_company_id = 'company-a-uuid';
SELECT COUNT(*) FROM clients; -- Solo debe ver clientes de company A

SET app.current_company_id = 'company-b-uuid';
SELECT COUNT(*) FROM clients; -- Solo debe ver clientes de company B
```

### **Test 2: Límites por Plan**

```javascript
// Verificar validación de límites
const basic_company = await createCompany({ plan: "basic" });
for (let i = 0; i < 6; i++) {
  // Intentar crear 6 usuarios (límite: 5)
  const result = await createUser(basic_company.id);
  if (i === 5) expect(result.error).toBe("Límite de usuarios alcanzado");
}
```

### **Test 3: JWT Multi-Tenant**

```javascript
// Verificar que JWT contiene company_id
const token = await loginUser(user_company_A);
const decoded = jwt.decode(token);
expect(decoded.company_id).toBe(company_A.id);
```

---

# 🚨 RIESGOS Y MITIGACIONES

## ⚠️ Riesgos Identificados

### **Riesgo 1: Pérdida de datos durante migración**

**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:**

- Backup completo antes de migración
- Scripts de rollback probados
- Migración por fases con validación

### **Riesgo 2: Performance degradado por RLS**

**Probabilidad:** Media  
**Impacto:** Medio  
**Mitigación:**

- Índices optimizados desde el inicio
- Monitoreo continuo de queries
- Cache estratégico por empresa

### **Riesgo 3: Filtración de datos entre empresas**

**Probabilidad:** Baja  
**Impacto:** Crítico  
**Mitigación:**

- Tests exhaustivos de aislamiento
- Code review obligatorio en todos los endpoints
- Auditoría de políticas RLS

---

# 📈 MÉTRICAS DE ÉXITO

## 🎯 KPIs Técnicos

- **✅ Aislamiento:** 100% de datos aislados entre empresas
- **⚡ Performance:** < 300ms tiempo respuesta promedio API
- **🔒 Seguridad:** 0 brechas de datos entre empresas
- **📊 Escalabilidad:** Soportar 50+ empresas simultáneas

## 🎯 KPIs de Negocio

- **🚀 Onboarding:** Nueva empresa operativa en < 10 minutos
- **👥 Adopción:** 90% de empresas usando todas las funcionalidades
- **💰 Límites:** Sistema de límites funcionando en 100% de casos
- **📞 Support:** < 1 ticket por empresa/mes relacionado con multi-tenancy

---

# 🛠️ HERRAMIENTAS Y SCRIPTS

## 📁 Estructura de Scripts

```
scripts/
├── database/
│   ├── 01_create_companies.sql
│   ├── 02_migrate_users_multitenancy.sql
│   ├── 03_add_company_id_all_tables.sql
│   ├── 04_enable_rls.sql
│   ├── 05_utility_functions.sql
│   ├── 06_company_invitations.sql
│   └── 07_subscription_plans.sql
├── migration/
│   ├── migrate_existing_data.sql
│   └── rollback_migration.sql
├── performance/
│   └── optimize_indexes.sql
└── deploy/
    └── deploy_multitenancy.sh
```

## 🎮 Comandos Útiles

```bash
# Migración completa
npm run migrate:multitenancy

# Verificar aislamiento RLS
npm run test:isolation

# Deploy con multi-tenancy
npm run deploy:multitenancy

# Rollback de emergencia
npm run rollback:multitenancy
```

---

# 🎉 CONCLUSIONES Y SIGUIENTES PASOS

## ✅ Al Completar Este Roadmap

1. **Sistema Multi-Tenant Completo** funcionando con Express + PostgreSQL
2. **Aislamiento Total** de datos entre empresas garantizado
3. **Sistema de Planes** flexible y escalable implementado
4. **API Multi-Tenant** con middleware centralizado
5. **Frontend Preparado** con contexto de empresa integrado

## 🚀 Siguientes Pasos Post-Implementación

1. **Migración a Render/Neon** con sistema multi-tenant ya funcionando
2. **Implementación de Analytics** por empresa
3. **Sistema de Facturación** automático por plan
4. **White-Label** personalización por empresa
5. **Internacionalización** multi-idioma

---

> **🎯 Objetivo Final:** Transformar AG-PYMEs en una plataforma SaaS robusta y escalable, lista para servir múltiples empresas con total seguridad y aislamiento de datos.

**¡El futuro multi-tenant de AG-PYMEs comienza ahora! 🚀**
