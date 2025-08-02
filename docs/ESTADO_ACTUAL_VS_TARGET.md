# 📊 Estado Actual vs Target - Sistema de Autenticación AG-PYMEs

**Fecha de Análisis:** 2 de agosto de 2025  
**Responsable:** Equipo de Desarrollo AG-PYMEs  
**Proyecto:** Refactorización del Sistema de Autenticación

---

## 🎯 Resumen Ejecutivo

### Situación Actual

- **Sistema Híbrido**: Supabase Auth + Custom Tokens + Legacy Users table
- **Edge Functions**: 24+ funciones desplegadas con vulnerabilidades críticas
- **Aislamiento**: Hardcoded company_id en lugar de aislamiento real
- **Seguridad**: Tokens inseguros usando btoa() y company_id expuesto

### Objetivo Target

- **Autenticación Unificada**: Solo Supabase Auth con RLS automático
- **Seguridad Robusta**: Company_id seguro en JWT, RLS policies completas
- **Zero Trust**: Aislamiento total por empresa sin hardcoding
- **Escalabilidad**: Sistema multi-tenant verdaderamente escalable

---

## 🔍 Análisis del Estado Actual

### ✅ Fortalezas Identificadas

#### 1. **Infraestructura Sólida**

- ✅ Supabase configurado correctamente
- ✅ 24+ Edge Functions desplegadas y funcionales
- ✅ React Native + Expo funcionando
- ✅ AuthContext implementado
- ✅ Base de datos PostgreSQL con 24 tablas

#### 2. **Funcionalidades Existentes**

- ✅ Sistema de login/registro operativo
- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión completa de inventario
- ✅ Sistema de alertas automatizado
- ✅ Análisis de rentabilidad y márgenes
- ✅ Cierre diario automatizado

#### 3. **Estructura de Datos**

- ✅ Esquema de base de datos bien definido
- ✅ Relaciones entre tablas establecidas
- ✅ Campo company_id presente en tablas relevantes

### 🚨 Vulnerabilidades Críticas Detectadas

#### 1. **Hardcoded Company ID**

```typescript
// CRÍTICO: Hardcoded en múltiples Edge Functions
const companyId = "12345678-1234-1234-1234-123456789abc";
```

**Impacto:**

- ❌ Todos los usuarios acceden a la misma empresa
- ❌ Violación total del aislamiento multi-tenant
- ❌ Riesgo crítico de seguridad y privacidad

**Ubicaciones Detectadas:**

- `/supabase/functions/login/index.ts`
- `/supabase/functions/register/index.ts`
- `/supabase/functions/companies/index.ts`
- `/supabase/functions/user-sync/index.ts`
- `AuthContext.js` (perfil temporal)

#### 2. **Tokens Inseguros**

```typescript
// INSEGURO: Token usando btoa() simple
const customToken = btoa(
  JSON.stringify({
    user_id: user.id,
    company_id: companyId,
    timestamp: Date.now(),
  })
);
```

**Problemas:**

- ❌ Base64 no es encriptación
- ❌ Fácilmente decodificable y manipulable
- ❌ Sin verificación de integridad
- ❌ Sin expiración segura

#### 3. **Sistema de Usuarios Triple**

- **auth.users** (Supabase Auth)
- **profiles** (Perfiles de usuario)
- **users** (Tabla legacy)

**Conflictos:**

- ❌ Sincronización manual requerida
- ❌ Posibles inconsistencias de datos
- ❌ Complejidad innecesaria

#### 4. **Ausencia de RLS Policies**

```sql
-- FALTA: Políticas RLS para aislamiento
-- Cada tabla necesita políticas como:
CREATE POLICY "company_isolation" ON tabla_name
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id');
```

**Riesgo:**

- ❌ Sin aislamiento real de datos
- ❌ Posible acceso cruzado entre empresas
- ❌ Violación de privacidad

### ⚠️ Problemas de Arquitectura

#### 1. **Extracción de Company ID Insegura**

```typescript
// PROBLEMÁTICO: Extracción manual de JWT
function extractCompanyId(authHeader: string | null): number | null {
  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.company_id || null;
}
```

#### 2. **Fallbacks Inseguros**

```javascript
// TEMPORAL: Perfiles hardcoded como fallback
const tempProfile = {
  company_id: "12345678-1234-1234-1234-123456789abc", // ❌ HARDCODED
  rol: "admin", // ❌ PRIVILEGIOS ELEVADOS POR DEFECTO
};
```

#### 3. **Falta de Validación**

- ❌ Sin validación de company_id en requests
- ❌ Sin verificación de pertenencia del usuario
- ❌ Sin control de acceso granular

---

## 🎯 Estado Target Objetivo

### 🔒 Arquitectura de Seguridad Target

#### 1. **Autenticación Unificada**

```typescript
// TARGET: Solo Supabase Auth con company_id en JWT
interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    company_id: string;
    role: string;
    profile_complete: boolean;
  };
}
```

#### 2. **RLS Policies Completas**

```sql
-- TARGET: Política estándar para todas las tablas
CREATE POLICY "company_isolation_policy" ON ${table_name}
  FOR ALL USING (
    company_id = (auth.jwt() ->> 'user_metadata' ->> 'company_id')::uuid
  );

-- TARGET: Política para administradores
CREATE POLICY "admin_access_policy" ON ${table_name}
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata' ->> 'role') = 'admin'
    AND company_id = (auth.jwt() ->> 'user_metadata' ->> 'company_id')::uuid
  );
```

#### 3. **Edge Functions Seguras**

```typescript
// TARGET: Extracción segura de company_id
const getCompanyIdFromAuth = async (): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.user_metadata?.company_id) {
    throw new Error("Unauthorized: No company association");
  }

  return user.user_metadata.company_id;
};
```

#### 4. **Sistema de Usuarios Unificado**

- **auth.users**: Autenticación principal
- **profiles**: Datos extendidos con company_id en user_metadata
- ❌ **users**: Eliminación de tabla legacy

### 🏗️ Arquitectura Multi-Tenant Target

#### 1. **Company ID Management**

```typescript
// TARGET: Company ID seguro en todas las operaciones
interface SecureRequest {
  company_id: string; // Extraído del JWT automáticamente
  user_id: string; // Usuario autenticado
  role: UserRole; // Rol validado
}
```

#### 2. **Aislamiento Automático**

```typescript
// TARGET: Queries automáticamente filtradas
const getClientsByCompany = async () => {
  // company_id se aplica automáticamente por RLS
  const { data } = await supabase.from("clients").select("*"); // RLS aplica filtro automático

  return data;
};
```

#### 3. **Registro Multi-Tenant**

```typescript
// TARGET: Registro con company creation/join
interface RegistrationData {
  email: string;
  password: string;
  nombre: string;
  mode: "create" | "join";
  companyData?: CreateCompanyData;
  invitationCode?: string;
}
```

### 📊 Base de Datos Target

#### 1. **Tablas con Company ID Obligatorio**

```sql
-- TARGET: Todas las tablas con company_id NOT NULL
ALTER TABLE alerts ADD CONSTRAINT alerts_company_id_not_null
  CHECK (company_id IS NOT NULL);

-- Repetir para todas las 24 tablas identificadas
```

#### 2. **Índices Optimizados**

```sql
-- TARGET: Índices para performance con company_id
CREATE INDEX idx_alerts_company_id ON alerts(company_id);
CREATE INDEX idx_sales_company_id ON sales(company_id);
CREATE INDEX idx_clients_company_id ON clients(company_id);
-- ... para todas las tablas
```

#### 3. **Constraints de Integridad**

```sql
-- TARGET: Referencias FK con company_id
ALTER TABLE sales
  ADD CONSTRAINT fk_sales_client_company
  FOREIGN KEY (id_cliente, company_id)
  REFERENCES clients(id_cliente, company_id);
```

---

## 📋 Tabla de Comparación Detallada

| Aspecto              | Estado Actual                 | Estado Target       | Prioridad  |
| -------------------- | ----------------------------- | ------------------- | ---------- |
| **Autenticación**    | Supabase Auth + Custom tokens | Solo Supabase Auth  | 🔴 Crítica |
| **Company ID**       | Hardcoded `"12345678-..."`    | JWT user_metadata   | 🔴 Crítica |
| **Aislamiento**      | ❌ Sin aislamiento real       | ✅ RLS automático   | 🔴 Crítica |
| **Tokens**           | ❌ btoa() inseguro            | ✅ Supabase JWT     | 🔴 Crítica |
| **RLS Policies**     | ❌ No implementadas           | ✅ 24 policies      | 🔴 Crítica |
| **Sistema Usuarios** | Triple sistema                | Unificado           | 🟡 Alta    |
| **Edge Functions**   | 24 con vulnerabilidades       | 24 seguras          | 🔴 Crítica |
| **Registro**         | Funcional pero inseguro       | Multi-tenant seguro | 🟡 Alta    |
| **Performance**      | ✅ Buena con cache            | ✅ Optimizada       | 🟢 Media   |
| **Monitoreo**        | ✅ Dashboard funcional        | ✅ Mejorado         | 🟢 Baja    |

---

## 🔍 Análisis de Impacto por Componente

### 1. **Edge Functions (24 funciones)**

#### Funciones Críticas que Requieren Refactoring:

1. **login** - Tokens inseguros
2. **register** - Company creation/join inseguro
3. **companies** - Hardcoded company_id
4. **user-sync** - Sincronización manual
5. **alerts** - Sin aislamiento real
6. **clients** - Acceso cruzado posible
7. **sales** - Datos financieros sin protección
8. **inventory** - Stock sin aislamiento
9. **employees** - RRHH sin protección
10. **appointments** - Citas sin aislamiento

#### Funciones de Menor Riesgo:

- dashboard (métricas agregadas)
- settings (configuración general)
- signed-url (archivos)

### 2. **Base de Datos (24 tablas)**

#### Tablas Críticas para RLS:

1. **sales** - Datos financieros sensibles
2. **clients** - Información personal/empresarial
3. **employees** - Datos RRHH sensibles
4. **inventory** - Stock y precios
5. **appointments** - Citas de clientes
6. **expenses** - Gastos empresariales
7. **income** - Ingresos empresariales

#### Tablas de Configuración:

- companies
- settings
- users/profiles

### 3. **Frontend (React Native)**

#### Componentes Afectados:

- **AuthContext**: Refactoring completo
- **API Services**: Actualización de headers
- **Login/Register Screens**: Nuevo flujo
- **Dashboard**: Validación de datos
- **Todas las pantallas**: Verificación de aislamiento

---

## 🚨 Análisis de Riesgos

### Riesgos Críticos Actuales

1. **Violación de Privacidad**: Todos los usuarios ven datos de la misma empresa
2. **Brecha de Seguridad**: Tokens fácilmente manipulables
3. **Compliance**: Violación GDPR por falta de aislamiento
4. **Escalabilidad**: Imposible añadir nuevas empresas

### Riesgos Durante la Migración

1. **Downtime**: Durante implementación de RLS policies
2. **Data Loss**: Error en migración de datos
3. **Auth Breaking**: Usuarios sin acceso temporal
4. **Performance**: Degradación por nuevas policies

### Mitigaciones Propuestas

1. **Blue-Green Deployment**: Para minimizar downtime
2. **Rollback Plan**: Volver al estado anterior si es necesario
3. **Testing Riguroso**: En environment de desarrollo
4. **Backup Completo**: Antes de cada cambio crítico

---

## 📊 Métricas de Éxito

### KPIs de Seguridad

- ✅ **100% Aislamiento**: Cada empresa ve solo sus datos
- ✅ **0 Hardcoded IDs**: Eliminación completa
- ✅ **24 RLS Policies**: Una por tabla relevante
- ✅ **JWT Validation**: En todas las Edge Functions

### KPIs de Performance

- ✅ **< 500ms**: Tiempo de respuesta promedio
- ✅ **99.9% Uptime**: Durante migración
- ✅ **0 Data Loss**: Migración sin pérdidas
- ✅ **< 1 segundo**: Login/logout time

### KPIs de Funcionalidad

- ✅ **100% Features**: Todas las funciones actuales
- ✅ **Multi-tenant**: Soporte para múltiples empresas
- ✅ **Backwards Compatible**: APIs existentes funcionando
- ✅ **Auto Migration**: Usuarios existentes migrados

---

## 🎯 Plan de Convergencia

### Fase 1: Fundaciones (Días 1-7)

1. **Análisis Completo** ✅ (Día 1)
2. **Branch de Desarrollo** (Día 1)
3. **RLS Policies Base** (Días 2-3)
4. **Auth Refactoring** (Días 4-5)
5. **Testing Framework** (Días 6-7)

### Fase 2: Core Security (Días 8-14)

1. **Edge Functions Refactor** (Días 8-10)
2. **JWT Implementation** (Días 11-12)
3. **Company Management** (Días 13-14)

### Fase 3: Integration (Días 15-21)

1. **Frontend Integration** (Días 15-17)
2. **API Updates** (Días 18-19)
3. **End-to-End Testing** (Días 20-21)

### Fase 4: Production (Días 22-30)

1. **Performance Optimization** (Días 22-24)
2. **Security Audit** (Días 25-26)
3. **Production Deployment** (Días 27-28)
4. **Monitoring & Validation** (Días 29-30)

---

## 🔧 Siguiente Pasos Inmediatos

### Hoy (Día 1)

1. ✅ **Documento Estado Actual vs Target** - COMPLETADO
2. ⏳ **Crear branch `refactor/auth-system`**
3. ⏳ **Configurar entorno de testing**
4. ⏳ **Implementar primera RLS policy de prueba**

### Mañana (Día 2)

1. **Implementar RLS policies básicas**
2. **Crear utility para extracción segura de company_id**
3. **Refactorizar primera Edge Function crítica**
4. **Setup del entorno de testing**

### Esta Semana (Días 3-7)

1. **Completar refactoring de autenticación**
2. **Implementar todas las RLS policies**
3. **Testing de aislamiento**
4. **Documentación técnica**

---

## 📝 Conclusiones

### Estado Actual: 🔴 **CRÍTICO**

- Sistema funcional pero con vulnerabilidades graves
- Aislamiento completamente comprometido
- Riesgo alto de violación de privacidad y seguridad

### Viabilidad del Target: ✅ **ALTA**

- Infraestructura Supabase sólida
- Funcionalidades bien definidas
- Plan de migración factible

### Tiempo Estimado: **30 días**

- Refactoring crítico: 14 días
- Testing e integración: 10 días
- Deployment y validación: 6 días

### Recomendación: 🚀 **PROCEDER INMEDIATAMENTE**

La refactorización es crítica y debe iniciarse sin demora. El sistema actual presenta riesgos inaceptables de seguridad que deben ser resueltos urgentemente.

---

**Documento generado el: 2 de agosto de 2025**  
**Próxima revisión: 9 de agosto de 2025**  
**Estado: 🔴 REQUIERE ACCIÓN INMEDIATA**
