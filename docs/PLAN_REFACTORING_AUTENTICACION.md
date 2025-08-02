# Plan de Refactoring del Sistema de Autenticación

## Objetivo

Refactorizar el sistema de autenticación actual para crear una solución robusta, segura y mantenible que elimine los problemas de migración existentes y establezca una base sólida para el crecimiento futuro.

## Análisis de Problemas Actuales

### 🔴 Problemas Críticos Identificados

1. **Doble Sistema de Usuarios**: `auth.users` + `profiles` vs `users` legacy
2. **Inconsistencias de Token**: Gestión híbrida Supabase + localStorage
3. **RLS Policies Fragmentadas**: Políticas inconsistentes entre tablas
4. **Sincronización Manual**: Edge Function `user-sync` como parche
5. **Company_ID Hardcodeado**: Fallbacks temporales que causan problemas
6. **Falta de Atomicidad**: Operaciones de registro no transaccionales

## Arquitectura Target - Enfoque Senior

### 1. Principios de Diseño

#### 🎯 Single Source of Truth

- **Supabase Auth** como única fuente de autenticación
- **Tabla `profiles`** como extensión de `auth.users`
- **Eliminación** completa del sistema legacy

#### 🔒 Security First

- RLS policies consistentes y auditadas
- Principio de menor privilegio
- Validación de entrada en múltiples capas
- Logs de auditoría completos

#### 🛠️ Mantenibilidad

- Separación clara de responsabilidades
- Interfaces bien definidas
- Testing exhaustivo
- Documentación completa

#### ⚡ Performance & Reliability

- Transacciones atómicas
- Circuit breakers
- Retry strategies
- Caching inteligente

## Arquitectura Backend (Supabase)

### 1. Database Schema Refactoring

#### A. Tabla `public.profiles` (Rediseñada)

```sql
-- Tabla principal de perfiles con restricciones mejoradas
CREATE TABLE public.profiles (
  -- Identidad (INMUTABLE)
  id uuid NOT NULL,
  email text NOT NULL,

  -- Información personal (MUTABLE)
  nombre text NOT NULL,
  telefono character varying,
  avatar_url text,

  -- Información de empresa (CRÍTICO)
  company_id uuid NOT NULL,                   -- ¡NUNCA NULL!
  rol profile_role NOT NULL DEFAULT 'user',  -- ENUM definido
  departamento character varying,
  cargo character varying,
  fecha_contratacion date,

  -- Estado y auditoría
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz,
  login_count integer DEFAULT 0,

  -- Configuración
  configuracion jsonb NOT NULL DEFAULT '{}',
  timezone text DEFAULT 'Europe/Madrid',
  locale text DEFAULT 'es-ES',

  -- Constraints
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_email_unique UNIQUE (email),
  CONSTRAINT profiles_company_user_unique UNIQUE (company_id, email),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id)
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id)
    REFERENCES public.companies(id) ON DELETE RESTRICT
);

-- ENUM para roles
CREATE TYPE profile_role AS ENUM ('admin', 'manager', 'user', 'viewer');

-- Índices para performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_profiles_email_active ON public.profiles(email) WHERE activo = true;
CREATE INDEX idx_profiles_last_login ON public.profiles(last_login DESC);
```

#### B. Tabla `public.companies` (Optimizada)

```sql
-- Tabla de empresas con validaciones estrictas
CREATE TABLE public.companies (
  -- Identidad
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  company_code text NOT NULL,

  -- Suscripción y límites
  subscription_plan subscription_plan_type NOT NULL DEFAULT 'basic',
  subscription_status subscription_status_type NOT NULL DEFAULT 'active',
  subscription_expires_at timestamptz,
  trial_ends_at timestamptz,

  -- Límites por plan (NO NULLABLES)
  max_users integer NOT NULL,
  max_clients integer NOT NULL,
  max_products integer NOT NULL,
  max_storage_mb integer NOT NULL,

  -- Configuración de negocio
  tax_rate numeric(5,2) NOT NULL DEFAULT 21.00,
  default_currency char(3) NOT NULL DEFAULT 'EUR',
  timezone text NOT NULL DEFAULT 'Europe/Madrid',

  -- Información de contacto
  company_email text,
  company_phone text,
  company_address jsonb,
  company_website text,
  tax_id text,

  -- Estado y auditoría
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,

  -- Configuración avanzada
  settings jsonb NOT NULL DEFAULT '{}',
  branding jsonb NOT NULL DEFAULT '{}',

  -- Constraints
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_code_unique UNIQUE (company_code),
  CONSTRAINT companies_name_unique UNIQUE (company_name),
  CONSTRAINT companies_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES auth.users(id),
  CONSTRAINT companies_tax_rate_check CHECK (tax_rate >= 0 AND tax_rate <= 100),
  CONSTRAINT companies_currency_check CHECK (length(default_currency) = 3)
);

-- ENUMs para tipos de suscripción
CREATE TYPE subscription_plan_type AS ENUM ('basic', 'pro', 'premium', 'enterprise');
CREATE TYPE subscription_status_type AS ENUM ('active', 'suspended', 'canceled', 'expired');
```

#### C. Sistema de Invitaciones Mejorado

```sql
CREATE TABLE public.company_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,

  -- Código de invitación seguro
  invitation_code text NOT NULL,
  invitation_hash text NOT NULL,  -- Hash del código para seguridad

  -- Información de invitación
  invited_email text NOT NULL,
  invited_role profile_role NOT NULL DEFAULT 'user',
  invited_by_user_id uuid NOT NULL,

  -- Estado y fechas
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  used_by_user_id uuid,

  -- Auditoría
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Metadata
  invitation_data jsonb DEFAULT '{}',

  -- Constraints
  CONSTRAINT company_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_code_unique UNIQUE (invitation_code),
  CONSTRAINT invitations_company_email_unique UNIQUE (company_id, invited_email),
  CONSTRAINT invitations_company_fkey FOREIGN KEY (company_id)
    REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by_user_id)
    REFERENCES public.profiles(id),
  CONSTRAINT invitations_used_by_fkey FOREIGN KEY (used_by_user_id)
    REFERENCES public.profiles(id)
);

CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
```

### 2. Row Level Security (RLS) - Enfoque Consistente

#### A. Políticas Base

```sql
-- 1. Política para profiles - Solo ver propio perfil y colegas de empresa
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- 2. Política para profiles - Solo actualizar propio perfil o ser admin
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR
  (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
   AND (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

-- 3. Política genérica para aislamiento por empresa
CREATE OR REPLACE FUNCTION create_company_isolation_policy(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE POLICY "%s_company_isolation" ON public.%s
    FOR ALL USING (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con company_id
SELECT create_company_isolation_policy('clients');
SELECT create_company_isolation_policy('employees');
SELECT create_company_isolation_policy('inventory');
-- ... etc
```

#### B. Funciones de Seguridad

```sql
-- Función para verificar permisos de rol
CREATE OR REPLACE FUNCTION has_role_permission(required_role profile_role)
RETURNS boolean AS $$
DECLARE
  user_role profile_role;
BEGIN
  SELECT rol INTO user_role
  FROM public.profiles
  WHERE id = auth.uid() AND activo = true;

  RETURN CASE required_role
    WHEN 'viewer' THEN user_role IN ('viewer', 'user', 'manager', 'admin')
    WHEN 'user' THEN user_role IN ('user', 'manager', 'admin')
    WHEN 'manager' THEN user_role IN ('manager', 'admin')
    WHEN 'admin' THEN user_role = 'admin'
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener company_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT company_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Triggers y Automatización

#### A. Trigger para Auto-Creación de Perfiles

```sql
-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_company_id uuid;
  user_company_id uuid;
  user_role profile_role;
BEGIN
  -- Extraer company_id y rol de user_metadata
  user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::profile_role,
    'user'::profile_role
  );

  -- Validar que company_id existe y está activa
  IF user_company_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = user_company_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive company_id: %', user_company_id;
  END IF;

  -- Crear perfil
  INSERT INTO public.profiles (
    id, email, nombre, company_id, rol, activo, created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    user_company_id,
    user_role,
    true,
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

#### B. Trigger para Validación de Límites

```sql
-- Función genérica para validar límites
CREATE OR REPLACE FUNCTION validate_company_limits()
RETURNS trigger AS $$
DECLARE
  current_count integer;
  max_allowed integer;
  resource_type text;
BEGIN
  -- Determinar tipo de recurso
  resource_type := CASE TG_TABLE_NAME
    WHEN 'profiles' THEN 'users'
    WHEN 'clients' THEN 'clients'
    WHEN 'inventory' THEN 'products'
    ELSE TG_TABLE_NAME
  END;

  -- Obtener límite actual
  EXECUTE format(
    'SELECT max_%s FROM public.companies WHERE id = $1',
    CASE resource_type
      WHEN 'users' THEN 'users'
      WHEN 'clients' THEN 'clients'
      WHEN 'products' THEN 'products'
    END
  ) INTO max_allowed USING NEW.company_id;

  -- Contar recursos actuales
  EXECUTE format(
    'SELECT COUNT(*) FROM public.%I WHERE company_id = $1 AND %s',
    TG_TABLE_NAME,
    CASE TG_TABLE_NAME
      WHEN 'profiles' THEN 'activo = true'
      ELSE 'true'
    END
  ) INTO current_count USING NEW.company_id;

  -- Validar límite
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Company limit exceeded: % (max: %, current: %)',
      resource_type, max_allowed, current_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER validate_profiles_limit
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION validate_company_limits();

CREATE TRIGGER validate_clients_limit
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION validate_company_limits();

CREATE TRIGGER validate_inventory_limit
  BEFORE INSERT ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION validate_company_limits();
```

### 4. Edge Functions Refactorizadas

#### A. Edge Function: `auth-register` (Nueva)

```typescript
// supabase/functions/auth-register/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  mode: "create" | "join";
  companyData?: {
    companyName: string;
    companyCode: string;
    subscriptionPlan: string;
  };
  invitationCode?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: RegisterRequest = await req.json();

    // Validaciones
    if (!body.email || !body.password || !body.nombre) {
      throw new Error("Missing required fields");
    }

    let companyId: string;
    let userRole: string = "user";

    // Transacción atómica
    const { data, error } = await supabaseAdmin.rpc("register_user_atomic", {
      p_email: body.email,
      p_password: body.password,
      p_nombre: body.nombre,
      p_mode: body.mode,
      p_company_data: body.companyData || null,
      p_invitation_code: body.invitationCode || null,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: data.user,
          company: data.company,
          profile: data.profile,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
```

#### B. Función SQL: `register_user_atomic`

```sql
-- Función transaccional para registro
CREATE OR REPLACE FUNCTION register_user_atomic(
  p_email text,
  p_password text,
  p_nombre text,
  p_mode text,
  p_company_data jsonb DEFAULT NULL,
  p_invitation_code text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  new_user_id uuid;
  company_id uuid;
  user_role profile_role := 'user';
  company_record record;
  result jsonb;
BEGIN
  -- Validaciones iniciales
  IF p_mode NOT IN ('create', 'join') THEN
    RAISE EXCEPTION 'Invalid mode: %', p_mode;
  END IF;

  -- Modo: Crear empresa
  IF p_mode = 'create' THEN
    IF p_company_data IS NULL THEN
      RAISE EXCEPTION 'Company data required for create mode';
    END IF;

    -- Crear empresa
    INSERT INTO public.companies (
      company_name,
      company_code,
      subscription_plan,
      max_users,
      max_clients,
      max_products,
      max_storage_mb
    ) VALUES (
      p_company_data->>'companyName',
      p_company_data->>'companyCode',
      COALESCE(p_company_data->>'subscriptionPlan', 'basic'),
      CASE COALESCE(p_company_data->>'subscriptionPlan', 'basic')
        WHEN 'basic' THEN 5
        WHEN 'pro' THEN 20
        WHEN 'premium' THEN 50
        WHEN 'enterprise' THEN 100
        ELSE 5
      END,
      CASE COALESCE(p_company_data->>'subscriptionPlan', 'basic')
        WHEN 'basic' THEN 100
        WHEN 'pro' THEN 500
        WHEN 'premium' THEN 1000
        WHEN 'enterprise' THEN 2000
        ELSE 100
      END,
      CASE COALESCE(p_company_data->>'subscriptionPlan', 'basic')
        WHEN 'basic' THEN 500
        WHEN 'pro' THEN 2000
        WHEN 'premium' THEN 5000
        WHEN 'enterprise' THEN 10000
        ELSE 500
      END,
      CASE COALESCE(p_company_data->>'subscriptionPlan', 'basic')
        WHEN 'basic' THEN 1024
        WHEN 'pro' THEN 5120
        WHEN 'premium' THEN 10240
        WHEN 'enterprise' THEN 20480
        ELSE 1024
      END
    ) RETURNING id INTO company_id;

    user_role := 'admin';

  -- Modo: Unirse a empresa
  ELSIF p_mode = 'join' THEN
    IF p_invitation_code IS NULL THEN
      RAISE EXCEPTION 'Invitation code required for join mode';
    END IF;

    -- Validar y usar invitación
    SELECT ci.company_id, ci.invited_role INTO company_id, user_role
    FROM public.company_invitations ci
    WHERE ci.invitation_code = p_invitation_code
      AND ci.status = 'pending'
      AND ci.expires_at > now()
      AND ci.invited_email = p_email;

    IF company_id IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired invitation code';
    END IF;

    -- Marcar invitación como usada
    UPDATE public.company_invitations
    SET status = 'accepted', used_at = now()
    WHERE invitation_code = p_invitation_code;
  END IF;

  -- Crear usuario en auth.users con metadata
  SELECT auth.admin_create_user(
    p_email,
    p_password,
    jsonb_build_object(
      'company_id', company_id,
      'role', user_role,
      'nombre', p_nombre
    )
  ) INTO new_user_id;

  -- El perfil se crea automáticamente por trigger

  -- Obtener datos para respuesta
  SELECT * INTO company_record FROM public.companies WHERE id = company_id;

  result := jsonb_build_object(
    'user', jsonb_build_object('id', new_user_id, 'email', p_email),
    'company', row_to_json(company_record),
    'profile', jsonb_build_object(
      'id', new_user_id,
      'email', p_email,
      'nombre', p_nombre,
      'company_id', company_id,
      'rol', user_role
    )
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Arquitectura Frontend

### 1. Nuevo AuthService - Patrón Singleton

```typescript
// services/auth/AuthService.ts
import {
  createClient,
  SupabaseClient,
  Session,
  User,
} from "@supabase/supabase-js";
import { AuthTokenManager } from "./AuthTokenManager";
import { AuthEventEmitter } from "./AuthEventEmitter";
import { AuthRetryStrategy } from "./AuthRetryStrategy";

export interface AuthProfile {
  id: string;
  email: string;
  nombre: string;
  company_id: string;
  rol: "admin" | "manager" | "user" | "viewer";
  activo: boolean;
  last_login?: string;
  configuracion: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  profile: AuthProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export class AuthService {
  private static instance: AuthService;
  private supabase: SupabaseClient;
  private tokenManager: AuthTokenManager;
  private eventEmitter: AuthEventEmitter;
  private retryStrategy: AuthRetryStrategy;
  private currentState: AuthState;

  private constructor() {
    this.supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: new SecureAuthStorage(),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    );

    this.tokenManager = new AuthTokenManager(this.supabase);
    this.eventEmitter = new AuthEventEmitter();
    this.retryStrategy = new AuthRetryStrategy();

    this.currentState = {
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    };

    this.initialize();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // Setup auth state listener
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`🔐 Auth event: ${event}`);
        await this.handleAuthStateChange(event, session);
      });

      // Initialize current session
      const {
        data: { session },
      } = await this.supabase.auth.getSession();
      if (session) {
        await this.handleAuthStateChange("SIGNED_IN", session);
      } else {
        this.updateState({ isLoading: false });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      this.updateState({
        isLoading: false,
        error: "Failed to initialize authentication",
      });
    }
  }

  private async handleAuthStateChange(
    event: string,
    session: Session | null
  ): Promise<void> {
    try {
      switch (event) {
        case "SIGNED_IN":
          if (session?.user) {
            await this.handleSignIn(session);
          }
          break;

        case "SIGNED_OUT":
          await this.handleSignOut();
          break;

        case "TOKEN_REFRESHED":
          if (session) {
            await this.tokenManager.updateSession(session);
          }
          break;

        default:
          console.log(`Unhandled auth event: ${event}`);
      }
    } catch (error) {
      console.error(`Error handling auth event ${event}:`, error);
      this.updateState({ error: error.message });
    }
  }

  private async handleSignIn(session: Session): Promise<void> {
    try {
      this.updateState({
        user: session.user,
        session,
        isLoading: true,
      });

      // Load user profile with retry
      const profile = await this.retryStrategy.execute(
        () => this.loadUserProfile(session.user.id),
        { maxRetries: 3, delay: 1000 }
      );

      this.updateState({
        profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Update token and emit events
      await this.tokenManager.updateSession(session);
      this.eventEmitter.emit("auth:signIn", { user: session.user, profile });
    } catch (error) {
      console.error("Sign in handling error:", error);
      this.updateState({
        isLoading: false,
        error: "Failed to load user profile",
      });
    }
  }

  private async handleSignOut(): Promise<void> {
    await this.tokenManager.clearSession();
    this.updateState({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    this.eventEmitter.emit("auth:signOut");
  }

  private async loadUserProfile(userId: string): Promise<AuthProfile> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .eq("activo", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Profile not found - user may need to be synced");
      }
      throw new Error(`Failed to load profile: ${error.message}`);
    }

    // Update last login
    await this.supabase
      .from("profiles")
      .update({
        last_login: new Date().toISOString(),
        login_count: (data.login_count || 0) + 1,
      })
      .eq("id", userId);

    return data;
  }

  // Public API Methods
  public async signIn(email: string, password: string): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        throw new AuthError(error.message, error.status);
      }

      // State will be updated by auth state change listener
    } catch (error) {
      this.updateState({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  }

  public async signUp(registrationData: {
    email: string;
    password: string;
    nombre: string;
    mode: "create" | "join";
    companyData?: any;
    invitationCode?: string;
  }): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/auth-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify(registrationData),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Auto sign-in after registration
      await this.signIn(registrationData.email, registrationData.password);
    } catch (error) {
      this.updateState({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  }

  public async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.warn("Sign out error:", error);
      }
      // State will be updated by auth state change listener
    } catch (error) {
      console.error("Sign out error:", error);
      // Force local cleanup even if remote signout fails
      await this.handleSignOut();
    }
  }

  public async refreshSession(): Promise<void> {
    const { error } = await this.supabase.auth.refreshSession();
    if (error) {
      throw new Error(`Failed to refresh session: ${error.message}`);
    }
  }

  // State management
  private updateState(updates: Partial<AuthState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.eventEmitter.emit("auth:stateChange", this.currentState);
  }

  public getState(): AuthState {
    return { ...this.currentState };
  }

  public subscribe(callback: (state: AuthState) => void): () => void {
    return this.eventEmitter.on("auth:stateChange", callback);
  }

  // Utility methods
  public isAuthenticated(): boolean {
    return this.currentState.isAuthenticated;
  }

  public hasRole(role: string): boolean {
    if (!this.currentState.profile) return false;

    const userRole = this.currentState.profile.rol;
    const roleHierarchy = {
      viewer: ["viewer"],
      user: ["viewer", "user"],
      manager: ["viewer", "user", "manager"],
      admin: ["viewer", "user", "manager", "admin"],
    };

    return roleHierarchy[userRole]?.includes(role) || false;
  }

  public getCompanyId(): string | null {
    return this.currentState.profile?.company_id || null;
  }

  public async waitForAuth(timeout = 10000): Promise<AuthState> {
    return new Promise((resolve, reject) => {
      if (!this.currentState.isLoading) {
        resolve(this.currentState);
        return;
      }

      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error("Authentication timeout"));
      }, timeout);

      const unsubscribe = this.subscribe((state) => {
        if (!state.isLoading) {
          clearTimeout(timer);
          unsubscribe();
          resolve(state);
        }
      });
    });
  }
}

// Error classes
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
```

### 2. Token Manager Seguro

```typescript
// services/auth/AuthTokenManager.ts
import { SupabaseClient, Session } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

export class AuthTokenManager {
  private static readonly TOKEN_KEY = "supabase_session";
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  private refreshTimer?: NodeJS.Timeout;
  private isRefreshing = false;

  constructor(private supabase: SupabaseClient) {}

  public async updateSession(session: Session): Promise<void> {
    try {
      // Store session securely
      await SecureStore.setItemAsync(
        AuthTokenManager.TOKEN_KEY,
        JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          token_type: session.token_type,
          user: session.user,
        })
      );

      // Setup auto-refresh
      this.scheduleRefresh(session);
    } catch (error) {
      console.error("Failed to store session:", error);
    }
  }

  public async getStoredSession(): Promise<Session | null> {
    try {
      const stored = await SecureStore.getItemAsync(AuthTokenManager.TOKEN_KEY);
      if (!stored) return null;

      const sessionData = JSON.parse(stored);

      // Check if token is still valid
      if (
        sessionData.expires_at &&
        sessionData.expires_at * 1000 < Date.now()
      ) {
        await this.clearSession();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error("Failed to get stored session:", error);
      return null;
    }
  }

  public async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AuthTokenManager.TOKEN_KEY);
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = undefined;
      }
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
  }

  private scheduleRefresh(session: Session): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!session.expires_at) return;

    const expiresAt = session.expires_at * 1000;
    const refreshAt = expiresAt - AuthTokenManager.REFRESH_THRESHOLD;
    const delay = Math.max(refreshAt - Date.now(), 0);

    this.refreshTimer = setTimeout(async () => {
      await this.refreshIfNeeded();
    }, delay);
  }

  private async refreshIfNeeded(): Promise<void> {
    if (this.isRefreshing) return;

    try {
      this.isRefreshing = true;
      console.log("🔄 Refreshing auth token...");

      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        console.error("Token refresh failed:", error);
        return;
      }

      if (data.session) {
        await this.updateSession(data.session);
        console.log("✅ Token refreshed successfully");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
    } finally {
      this.isRefreshing = false;
    }
  }
}
```

### 3. Context Mejorado con Error Boundaries

```typescript
// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthState } from '../services/auth/AuthService';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasRole: (role: string) => boolean;
  waitForAuth: (timeout?: number) => Promise<AuthState>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    refreshSession: authService.refreshSession.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    waitForAuth: authService.waitForAuth.bind(authService),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Error Boundary para manejar errores de autenticación
interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends React.Component<
  { children: ReactNode },
  AuthErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);

    // Log to crash reporting service
    // crashlytics().recordError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AuthErrorFallback
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

const AuthErrorFallback: React.FC<{
  error?: Error;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div style={{ padding: 20, textAlign: 'center' }}>
    <h2>Authentication Error</h2>
    <p>{error?.message || 'An authentication error occurred'}</p>
    <button onClick={onRetry}>Try Again</button>
  </div>
);
```

### 4. Hook Especializado para Límites de Empresa

```typescript
// hooks/useCompanyLimits.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

interface CompanyLimits {
  users: { current: number; max: number; percentage: number };
  clients: { current: number; max: number; percentage: number };
  products: { current: number; max: number; percentage: number };
  storage: { current: number; max: number; percentage: number };
}

interface CompanyUsage {
  users: number;
  clients: number;
  products: number;
  storageMB: number;
}

export const useCompanyLimits = () => {
  const { profile, isAuthenticated } = useAuth();
  const [limits, setLimits] = useState<CompanyLimits | null>(null);
  const [usage, setUsage] = useState<CompanyUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLimitsAndUsage = useCallback(async () => {
    if (!isAuthenticated || !profile?.company_id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/companies/limits`,
        {
          headers: {
            Authorization: `Bearer ${await authService.getAccessToken()}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setLimits(result.data.limits);
      setUsage(result.data.usage);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch company limits:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, profile?.company_id]);

  useEffect(() => {
    fetchLimitsAndUsage();
  }, [fetchLimitsAndUsage]);

  const canAddResource = useCallback(
    (resource: keyof CompanyUsage, amount = 1): boolean => {
      if (!limits || !usage) return false;
      return usage[resource] + amount <= limits[resource].max;
    },
    [limits, usage]
  );

  const getRemainingCapacity = useCallback(
    (resource: keyof CompanyUsage): number => {
      if (!limits || !usage) return 0;
      return Math.max(0, limits[resource].max - usage[resource]);
    },
    [limits, usage]
  );

  const getUsagePercentage = useCallback(
    (resource: keyof CompanyUsage): number => {
      if (!limits || !usage) return 0;
      const limit = limits[resource];
      return limit.max > 0
        ? Math.round((usage[resource] / limit.max) * 100)
        : 0;
    },
    [limits, usage]
  );

  return {
    limits,
    usage,
    loading,
    error,
    canAddResource,
    getRemainingCapacity,
    getUsagePercentage,
    refresh: fetchLimitsAndUsage,

    // Convenience methods
    canAddUser: (amount = 1) => canAddResource("users", amount),
    canAddClient: (amount = 1) => canAddResource("clients", amount),
    canAddProduct: (amount = 1) => canAddResource("products", amount),
    canUploadFile: (sizeMB: number) => canAddResource("storage", sizeMB),
  };
};
```

## Testing Strategy

### 1. Unit Tests

```typescript
// __tests__/AuthService.test.ts
import { AuthService } from "../services/auth/AuthService";

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = AuthService.getInstance();
  });

  describe("signIn", () => {
    it("should authenticate user with valid credentials", async () => {
      // Test implementation
    });

    it("should handle invalid credentials gracefully", async () => {
      // Test implementation
    });

    it("should retry on network failures", async () => {
      // Test implementation
    });
  });

  describe("profile loading", () => {
    it("should load user profile after successful auth", async () => {
      // Test implementation
    });

    it("should handle missing profiles", async () => {
      // Test implementation
    });
  });
});
```

### 2. Integration Tests

```typescript
// __tests__/auth-integration.test.ts
describe("Authentication Integration", () => {
  it("should complete full registration flow", async () => {
    // Test company creation + user registration + auto-login
  });

  it("should handle invitation-based registration", async () => {
    // Test invitation code validation + user joining
  });

  it("should enforce company limits", async () => {
    // Test limit validation during resource creation
  });
});
```

### 3. E2E Tests

```typescript
// e2e/auth.e2e.ts
describe("Authentication E2E", () => {
  it("should allow user to sign up, sign in, and access protected resources", async () => {
    // Full flow test
  });
});
```

## Migration Plan

### Phase 1: Foundation (Week 1-2)

1. ✅ Implement new database schema
2. ✅ Create and test triggers/functions
3. ✅ Deploy new Edge Functions
4. ✅ Setup comprehensive RLS policies

### Phase 2: Frontend Refactoring (Week 3-4)

1. ✅ Implement new AuthService
2. ✅ Update AuthContext and hooks
3. ✅ Add comprehensive error handling
4. ✅ Implement testing suite

### Phase 3: Migration & Cleanup (Week 5-6)

1. ✅ Migrate existing users to new system
2. ✅ Remove legacy code and dependencies
3. ✅ Performance optimization
4. ✅ Documentation and training

### Phase 4: Monitoring & Optimization (Week 7+)

1. ✅ Setup monitoring and alerts
2. ✅ Performance tuning
3. ✅ Security audit
4. ✅ User feedback integration

## Security Checklist

### Backend Security

- [ ] RLS policies on all tables
- [ ] Input validation on all functions
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging for auth events
- [ ] Regular security scans

### Frontend Security

- [ ] Secure token storage
- [ ] Input sanitization
- [ ] HTTPS enforcement
- [ ] Session timeout handling
- [ ] Error message sanitization

## Monitoring & Observability

### Metrics to Track

1. **Authentication Success Rate**
2. **Profile Loading Performance**
3. **Token Refresh Success Rate**
4. **Company Limit Violations**
5. **Edge Function Response Times**

### Alerting

1. **High Authentication Failure Rate**
2. **Profile Sync Failures**
3. **Token Refresh Failures**
4. **Edge Function Errors**

## Conclusion

Este plan proporciona una arquitectura de autenticación robusta, segura y mantenible que:

1. **Elimina la complejidad** del sistema híbrido actual
2. **Garantiza la seguridad** con RLS y validaciones apropiadas
3. **Facilita el mantenimiento** con código bien estructurado
4. **Escala eficientemente** con la empresa
5. **Proporciona visibilidad** completa del sistema

La implementación seguirá las mejores prácticas de un senior developer, con énfasis en testing, documentación y monitoreo continuo.
