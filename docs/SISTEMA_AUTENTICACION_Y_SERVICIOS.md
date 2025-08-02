# Sistema de Autenticación y Servicios - Contexto para IA

## Descripción General

Este documento describe el sistema de autenticación y servicios de una aplicación de gestión para PYMEs (React Native + Expo) que está migrando de un backend Node.js + PostgreSQL a Supabase. La aplicación maneja múltiples empresas (multi-tenant) con usuarios, roles y límites por plan de suscripción.

## Arquitectura Actual

### Estado de Migración

- **Sistema Legacy**: Backend Node.js con JWT + PostgreSQL
- **Sistema Target**: Supabase Auth + Edge Functions
- **Estado Actual**: Migración parcial con problemas de autenticación

### Estructura de Contextos

#### 1. AuthContext (Archivo Principal: `/context/AuthContext.js`)

**Propósito**: Gestiona el estado de autenticación del usuario y la sesión.

**Estados Principales**:

```javascript
const [user, setUser] = useState(null); // Usuario de Supabase Auth
const [profile, setProfile] = useState(null); // Perfil extendido desde tabla profiles
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [loading, setLoading] = useState(true);
const [session, setSession] = useState(null); // Sesión de Supabase
```

**Funciones Críticas**:

- `login({ email, contrasena })`: Autenticación usando Supabase Auth
- `register(registrationData)`: Registro multi-tenant con Edge Functions
- `logout()`: Cierre de sesión y limpieza
- `loadUserProfile(userId)`: Carga perfil desde tabla `profiles`
- `ensureTokenAvailable()`: Gestión de tokens con reintentos

**Particularidades**:

- Doble sistema de tokens: Supabase session + localStorage backup
- Auto-sincronización de perfiles faltantes usando Edge Function `user-sync`
- Creación de perfiles temporales como fallback
- Listeners para cambios de estado de auth

#### 2. CompanyContext (Archivo Principal: `/context/CompanyContext.js`)

**Propósito**: Gestiona datos de empresa, límites y validaciones de plan.

**Estados Principales**:

```javascript
const [company, setCompany] = useState(null); // Datos de la empresa
const [settings, setSettings] = useState(null); // Configuraciones
const [usage, setUsage] = useState(null); // Uso actual de recursos
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

**Funciones de Límites**:

- `checkLimit(resource, amount)`: Validación async de límites
- `getRemainingLimit(resource)`: Cálculo de recursos disponibles
- `canAddUser/Client/Product()`: Validaciones específicas
- `refreshData()`: Actualización completa de datos

**Recursos Gestionados**:

- `users`: Límite de usuarios por empresa
- `clients`: Límite de clientes
- `products`: Límite de productos en inventario
- `storage`: Límite de almacenamiento en MB

### Sistema de Servicios

#### 1. AuthService (Archivo: `/api/services/authService.js`)

**Funciones Principales**:

- `getAuthToken()`: Obtención de token desde Supabase session
- `login(credentials)`: Login directo con Supabase
- `checkAuth()`: Verificación de sesión activa
- `logoutUser()`: Logout y limpieza
- `refreshToken()`: Renovación de tokens

**Integración**: Usa tanto Supabase Auth como TokenStorage para compatibilidad.

#### 2. EdgeFunctionsService (Archivo: `/api/edgeFunctionsService.js`)

**Servicios Disponibles**:

- `authService`: Login/Register usando Edge Functions
- `companiesService`: Gestión de empresas y límites
- `alertsService`: Sistema de alertas
- `clientsService`: Gestión de clientes
- `employeesService`: Gestión de empleados
- Y 15+ servicios más para diferentes módulos

**Patrón de Respuesta**:

```javascript
{
  success: boolean,
  data: any,
  error?: string
}
```

#### 3. TokenStorage (Archivo: `/api/services/storage/tokenStorage.js`)

**Funcionalidades**:

- Cache en memoria con TTL (5 minutos)
- Persistencia usando BaseStorage
- Fallbacks para compatibilidad
- Gestión de errores robusta

### Sistema de Validaciones

#### 1. useCompanyLimits Hook (Archivo: `/hooks/useCompanyLimits.js`)

**Funciones de Validación**:

- `validateAction(resource, actionName, amount)`: Validación general
- `canAddUser/Client/Product()`: Validaciones específicas async
- `canUploadFile(fileSizeMB)`: Validación de almacenamiento
- `getUsagePercentage(resource)`: Cálculo de porcentajes
- `isNearLimit/isAtLimit(resource)`: Estados de límites

#### 2. companyInterceptor (Archivo: `/utils/companyInterceptor.js`)

**Componentes Disponibles**:

- `withCompanyValidation`: HOC para validar automáticamente
- `useCompanyValidation`: Hook manual de validación
- `CompanyLimitGuard`: Componente condicional de renderizado

### Flujo de Autenticación

#### 1. Inicialización de App (App.js)

```javascript
// Orden de contextos
<ThemeProvider>
  <AuthProvider>
    <CompanyProvider>
      <NotificationProvider>
        <GlobalCacheProvider>
          <MainApp />
```

#### 2. Proceso de Login

1. **UI**: `LoginRegisterScreen.js` → `useAuthLogic` hook
2. **Validación**: Validaciones de formulario con `validations.js`
3. **AuthContext**: `login()` usando Supabase Auth
4. **Profile Loading**: `loadUserProfile()` desde tabla `profiles`
5. **Company Loading**: CompanyContext se activa automáticamente
6. **Navigation**: Redirección a `AppNavigator`

#### 3. Proceso de Registro

1. **Modo Selection**: "Crear empresa" vs "Unirse a empresa"
2. **Edge Function**: Llamada a función `register`
3. **Multi-tenant Setup**: Creación de empresa + usuario + perfil
4. **Auto-login**: Login automático post-registro
5. **Sincronización**: Carga de datos de empresa

### Problemas Conocidos en la Migración

#### 1. Inconsistencias de Token

- **Síntoma**: Tokens no disponibles o desincronizados
- **Causa**: Doble gestión Supabase + localStorage
- **Ubicación**: `AuthContext.ensureTokenAvailable()`

#### 2. Profiles No Encontrados

- **Síntoma**: Profile null después de login exitoso
- **Causa**: Desincronización entre `auth.users` y tabla `profiles`
- **Solución Actual**: Auto-sync con Edge Function `user-sync`

#### 3. Company Context Loading

- **Síntoma**: Company data no se carga después de login
- **Causa**: Dependencia de `profile.company_id` que puede estar null
- **Fallback**: Company ID hardcodeado como temporal

#### 4. Edge Functions Timeout

- **Síntoma**: Funciones no responden o timeout
- **Causa**: Configuración incorrecta o funciones no desplegadas
- **Debug**: Usar `edgeFunctionsDiagnostics.js`

### Configuración Actual

#### Variables de Entorno Requeridas

```
EXPO_PUBLIC_SUPABASE_URL=tu_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

#### Edge Functions Desplegadas

- `register`: Registro multi-tenant
- `companies`: Gestión de empresas
- `user-sync`: Sincronización de usuarios

### Sistema de Límites y Planes

#### Planes Disponibles

```javascript
const plans = {
  basic: {
    max_users: 5,
    max_clients: 100,
    max_products: 500,
    max_storage_mb: 1024,
  },
  pro: {
    max_users: 20,
    max_clients: 500,
    max_products: 2000,
    max_storage_mb: 5120,
  },
  enterprise: {
    max_users: 100,
    max_clients: 2000,
    max_products: 10000,
    max_storage_mb: 20480,
  },
};
```

#### Validación de Límites

- **Automática**: En componentes con `withCompanyValidation`
- **Manual**: Usando `useCompanyLimits` hook
- **UI**: Componente `LimitChecker` para mostrar estado
- **Interceptor**: Prevención automática de acciones que excedan límites

### Componentes de Testing

#### 1. CompanyTestingPanel

- Panel de debug para límites
- Simulación de escenarios
- Validación en tiempo real

#### 2. edgeFunctionsDiagnostics

- Tests de conectividad
- Validación de Edge Functions
- Diagnóstico completo del sistema

### Navegación y Estado

#### AppNavigator Structure

```javascript
<Stack.Navigator>
  <Screen name="MainTabs" component={CustomBottomTabs} />
  <Screen name="Settings" component={SettingsScreen} />
  <Screen name="Alerts" component={AlertsScreen} />
</Stack.Navigator>
```

#### Bottom Tabs

- Home, Planner, Inventory, Financial, Employees, Sales
- Animaciones avanzadas con `react-native-reanimated`
- Optimizaciones de memoria (`lazy: false`, `unmountOnBlur: false`)

### Estrategias de Cache

#### GlobalCacheProvider

- Estrategias: TTL, bulk loading, intelligent
- Configuración adaptable por entorno
- Métricas y logging integrados
- Límites de memoria configurables

### Patrones de Error Handling

#### 1. Validaciones de Formulario

- Sistema centralizado en `validations.js`
- Mensajes localizados
- Validación en tiempo real

#### 2. Manejo de Errores de API

- Wrapper en `getErrorMessage()`
- Mapeo de errores específicos de Supabase
- Fallbacks y recuperación automática

#### 3. Notificaciones

- Context de notificaciones centralizado
- Tipos: success, error, warning, info
- Integración con validaciones de límites

### Consideraciones para Debugging

#### 1. Logs Importantes

- `🔐 Auth state changed`: Cambios de autenticación
- `👤 Loading user profile`: Carga de perfil
- `🔧 Profile not found`: Perfil no encontrado
- `✅ Company data loaded`: Datos de empresa cargados

#### 2. Estados Críticos a Verificar

- `user`: Usuario de Supabase Auth
- `profile`: Perfil extendido
- `session`: Sesión activa
- `company`: Datos de empresa
- `usage`: Uso actual de recursos

#### 3. Puntos de Fallo Comunes

- Token expiration sin refresh
- Profile creation failures
- Company data loading timeouts
- Edge Functions not deployed
- RLS policies misconfigured

### Recomendaciones para Resolución

1. **Verificar Variables de Entorno**: Usar `setupSupabase.js`
2. **Validar Edge Functions**: Usar `edgeFunctionsDiagnostics.js`
3. **Revisar RLS Policies**: En Supabase Dashboard
4. **Monitorear Logs**: Console y Supabase Dashboard
5. **Testing Incremental**: Usar `CompanyTestingPanel`

## Arquitectura de Base de Datos y Backend

### Esquema de Autenticación Multi-Tenant

#### 1. Tabla `auth.users` (Supabase Auth)

**Propósito**: Usuarios base del sistema de autenticación de Supabase.

- **Gestión**: Automática por Supabase Auth
- **Campos Críticos**: `id`, `email`, `email_confirmed_at`, `user_metadata`
- **Relación**: 1:1 con `public.profiles`

#### 2. Tabla `public.profiles`

**Propósito**: Perfiles extendidos de usuarios con información de empresa.

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL,                          -- FK a auth.users(id)
  nombre text NOT NULL,
  email text NOT NULL UNIQUE,
  rol text DEFAULT 'user'::text,             -- admin, user, manager, viewer
  company_id uuid,                           -- FK a companies(id)
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  -- Campos adicionales para empleados
  telefono character varying,
  departamento character varying,
  cargo character varying,
  fecha_contratacion date,
  avatar_url text,
  configuracion jsonb DEFAULT '{}'::jsonb
);
```

**Relaciones Críticas**:

- `id` → `auth.users(id)` (CASCADE DELETE)
- `company_id` → `companies(id)` (Aislamiento por empresa)

#### 3. Tabla `public.companies`

**Propósito**: Entidades principales del sistema multi-tenant.

```sql
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  company_name character varying NOT NULL,
  company_code character varying NOT NULL UNIQUE,  -- Código único para invitaciones
  subscription_plan character varying NOT NULL DEFAULT 'basic',
  -- Límites por plan
  max_users integer NOT NULL DEFAULT 5,
  max_clients integer NOT NULL DEFAULT 100,
  max_products integer NOT NULL DEFAULT 500,
  max_storage_mb integer NOT NULL DEFAULT 1000,
  -- Configuración
  tax_rate numeric DEFAULT 21.00,
  default_currency character varying DEFAULT 'EUR',
  settings jsonb DEFAULT '{}'::jsonb,
  timezone character varying DEFAULT 'Europe/Madrid',
  -- Estado
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  subscription_expires_at timestamp with time zone,
  trial_ends_at timestamp with time zone
);
```

**Planes de Suscripción**:

- `basic`: 5 usuarios, 100 clientes, 500 productos, 1GB
- `pro`: 20 usuarios, 500 clientes, 2000 productos, 5GB
- `premium`: 50 usuarios, 1000 clientes, 5000 productos, 10GB
- `enterprise`: 100 usuarios, 2000 clientes, 10000 productos, 20GB

#### 4. Tabla `public.company_invitations`

**Propósito**: Sistema de invitaciones para unirse a empresas.

```sql
CREATE TABLE public.company_invitations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL,
  invitation_code character varying NOT NULL UNIQUE,
  invited_email character varying,
  invited_by_user_id uuid,
  status character varying DEFAULT 'pending',     -- pending, accepted, expired, revoked
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  used_at timestamp with time zone,
  used_by_user_id uuid,
  created_at timestamp with time zone DEFAULT now()
);
```

#### 5. Tabla `public.users` (Legacy)

**Estado**: Tabla legacy del sistema anterior, en proceso de deprecación.

- **Problema**: Duplica funcionalidad con `auth.users` + `profiles`
- **Migración**: Datos se están migrando gradualmente a `profiles`
- **Inconsistencias**: Puede causar desincronización durante la transición

### Aislamiento Multi-Tenant

#### Row Level Security (RLS)

**Patrón Implementado**: Todas las tablas incluyen `company_id` como campo de aislamiento.

```sql
-- Ejemplo de política RLS para tabla clients
CREATE POLICY "Users can only see clients from their company"
ON public.clients
FOR ALL
USING (company_id = (
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid()
));
```

**Tablas con Aislamiento**:

- ✅ `alerts`, `appointments`, `clients`, `employees`
- ✅ `expenses`, `income`, `inventory`, `services`
- ✅ `sales`, `suppliers`, `settings`, `shifts`
- ✅ Todas las tablas relacionales (`*_details`, `*_levels`)

#### Validación de Límites por Plan

**Función de Base de Datos**:

```sql
-- Función para validar límites antes de inserts
CREATE OR REPLACE FUNCTION check_company_limits()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
  company_plan TEXT;
BEGIN
  -- Obtener plan actual
  SELECT subscription_plan INTO company_plan
  FROM companies
  WHERE id = NEW.company_id;

  -- Obtener límite según la tabla y plan
  CASE TG_TABLE_NAME
    WHEN 'clients' THEN
      SELECT max_clients INTO max_allowed FROM companies WHERE id = NEW.company_id;
    WHEN 'employees' THEN
      SELECT max_users INTO max_allowed FROM companies WHERE id = NEW.company_id;
    WHEN 'inventory' THEN
      SELECT max_products INTO max_allowed FROM companies WHERE id = NEW.company_id;
  END CASE;

  -- Contar registros actuales
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE company_id = $1', TG_TABLE_NAME)
  INTO current_count
  USING NEW.company_id;

  -- Validar límite
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Límite de % alcanzado para el plan %', TG_TABLE_NAME, company_plan;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Edge Functions Disponibles

#### 1. Function: `register`

**Propósito**: Registro multi-tenant con creación automática de empresa.

**Flujo**:

1. Crear usuario en `auth.users`
2. Crear empresa en `companies` (si mode = 'create')
3. Crear perfil en `profiles` con `company_id`
4. Configurar empresa con valores por defecto
5. Retornar usuario creado

**Validaciones**:

- Email único en sistema
- Company_code único (si creando empresa)
- Invitation_code válido (si uniéndose)

#### 2. Function: `companies`

**Endpoints**:

- `GET /companies/current`: Datos de empresa actual
- `GET /companies/usage`: Uso actual de recursos
- `POST /companies/validate-limit`: Validación de límites
- `PUT /companies/settings`: Actualizar configuración

#### 3. Function: `user-sync`

**Propósito**: Sincronización entre `auth.users` y `profiles`.

**Casos de Uso**:

- Profile no encontrado después de login
- Usuario creado externamente
- Migración de datos legacy

**Proceso**:

1. Buscar usuario en `auth.users`
2. Verificar/crear registro en `profiles`
3. Sincronizar con tabla `users` legacy
4. Retornar perfil sincronizado

### Problemas de Migración Específicos

#### 1. Desincronización de Perfiles

**Causa Raíz**:

- Usuarios creados en `auth.users` sin perfil correspondiente
- Fallos en triggers de auto-creación de perfiles
- Migración incompleta desde sistema legacy

**Síntomas**:

```javascript
// AuthContext.loadUserProfile() retorna null
// Aunque session.user existe
```

**Ubicaciones de Fallo**:

- Trigger `on_auth_user_created` no funcionando
- RLS bloqueando creación de perfiles
- Edge Function `user-sync` con errores

#### 2. Company_ID Null o Hardcodeado

**Problema**: Perfiles con `company_id` = null o valor temporal.

```sql
-- Usuarios problemáticos
SELECT p.id, p.email, p.company_id, c.company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.company_id IS NULL
   OR c.id IS NULL;
```

**Impacto**:

- CompanyContext no puede cargar datos
- RLS bloquea acceso a recursos
- Validaciones de límites fallan

#### 3. Doble Sistema de Usuarios

**Conflicto**: Tablas `auth.users` + `profiles` vs `users` legacy.

**Inconsistencias**:

- Mismos emails en ambos sistemas
- Diferentes roles/permisos
- Company_id diferentes
- Contraseñas no sincronizadas

#### 4. Edge Functions No Desplegadas

**Verificación**:

```bash
# Verificar funciones desplegadas
supabase functions list

# Logs de funciones
supabase functions logs user-sync
supabase functions logs register
supabase functions logs companies
```

### Configuración RLS Crítica

#### Políticas Esenciales

```sql
-- Política base para profiles
CREATE POLICY "Users can see own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = id);

-- Política para datos de empresa
CREATE POLICY "Users can see company data"
ON public.companies
FOR SELECT
USING (id = (
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid()
));

-- Política genérica para tablas con company_id
CREATE POLICY "Company isolation"
ON public.{table_name}
FOR ALL
USING (company_id = (
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid()
));
```

#### Permisos de Service Role

**Variables de Entorno Críticas**:

```bash
SUPABASE_SERVICE_ROLE_KEY=     # Para Edge Functions
SUPABASE_ANON_KEY=             # Para cliente público
SUPABASE_URL=                  # URL del proyecto
```

### Monitoreo y Debugging

#### Queries de Diagnóstico

```sql
-- 1. Verificar estado de autenticación
SELECT
  au.id,
  au.email,
  au.email_confirmed_at,
  p.nombre,
  p.company_id,
  c.company_name,
  c.subscription_plan
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
WHERE au.email = 'user@example.com';

-- 2. Contar uso de recursos por empresa
SELECT
  c.company_name,
  c.subscription_plan,
  COUNT(DISTINCT p.id) as users_count,
  c.max_users,
  COUNT(DISTINCT cl.id) as clients_count,
  c.max_clients,
  COUNT(DISTINCT inv.id) as products_count,
  c.max_products
FROM companies c
LEFT JOIN profiles p ON c.id = p.company_id AND p.activo = true
LEFT JOIN clients cl ON c.id = cl.company_id
LEFT JOIN inventory inv ON c.id = inv.company_id
WHERE c.id = 'company-uuid'
GROUP BY c.id, c.company_name, c.subscription_plan, c.max_users, c.max_clients, c.max_products;

-- 3. Detectar usuarios problemáticos
SELECT
  'auth_without_profile' as issue,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT
  'profile_without_company' as issue,
  p.id,
  p.email,
  p.created_at
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
WHERE p.company_id IS NULL OR c.id IS NULL;

-- 4. Verificar invitaciones activas
SELECT
  ci.invitation_code,
  ci.invited_email,
  ci.status,
  ci.expires_at,
  c.company_name,
  p.nombre as invited_by
FROM company_invitations ci
JOIN companies c ON ci.company_id = c.id
LEFT JOIN profiles p ON ci.invited_by_user_id = p.id
WHERE ci.status = 'pending'
  AND ci.expires_at > now();
```

#### Logs de Edge Functions

**Patrones de Error Comunes**:

```
❌ "User not found in auth.users"
❌ "Profile creation failed: RLS policy violation"
❌ "Company limit exceeded: max_users"
❌ "Invalid invitation code"
❌ "Token verification failed"
```

### Migración Progresiva

#### Fase 1: Autenticación Híbrida (Estado Actual)

- ✅ Supabase Auth para nuevos usuarios
- ⚠️ Sistema legacy para usuarios existentes
- ⚠️ Sincronización manual con `user-sync`

#### Fase 2: Migración Completa de Usuarios

- 🔄 Migrar tabla `users` a `profiles`
- 🔄 Actualizar todas las FK de `user_id`
- 🔄 Eliminar dependencias de sistema legacy

#### Fase 3: Optimización

- 🔄 Optimizar RLS policies
- 🔄 Implementar cache de límites
- 🔄 Automatizar limpieza de datos

### Checklist de Resolución

#### ✅ Base de Datos

- [ ] Verificar RLS policies habilitadas
- [ ] Confirmar triggers de auto-creación funcionando
- [ ] Validar consistencia de `company_id` en profiles
- [ ] Revisar límites por plan en tabla companies

#### ✅ Edge Functions

- [ ] Verificar deployment de funciones críticas
- [ ] Probar conectividad con variables de entorno
- [ ] Validar permisos de service role
- [ ] Monitorear logs de errores

#### ✅ Frontend

- [ ] Confirmar token storage funcionando
- [ ] Verificar listeners de auth state
- [ ] Validar flujo de carga de perfiles
- [ ] Probar sistema de fallbacks

Este documento proporciona el contexto completo del sistema de autenticación y servicios para facilitar el debugging y resolución de problemas durante la migración a Supabase.
