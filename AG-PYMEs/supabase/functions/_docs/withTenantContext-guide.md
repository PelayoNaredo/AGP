# 🚀 PLAN DE IMPLEMENTACIÓN: withTenantContext

## 📋 ¿Qué hacer ahora?

### **OPCIÓN 1: Aplicar Gradualmente (RECOMENDADO)**

#### **Paso 1: Elegir 1 Edge Function para convertir**

```bash
# Opciones recomendadas para empezar:
1. alerts (más simple)
2. suppliers (mediana complejidad)
3. inventory (más compleja)
```

#### **Paso 2: Hacer backup de la función original**

```bash
cd "c:\Users\North Arder\Desktop\AppGestionPYMEs\AG-PYMEs"
cp supabase\functions\alerts\index.ts supabase\functions\alerts\index.backup.ts
```

#### **Paso 3: Convertir la función**

```typescript
// Cambiar ESTO:
export default withCors(async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  // ... 30 líneas de autenticación manual
  const { companyId } = await getUserAndCompanyId(token);
  // ... lógica de negocio
});

// Por ESTO:
export default withTenantContext(async (req, ctx) => {
  const { companyId } = ctx; // ¡Ya disponible!
  // ... solo lógica de negocio
});
```

#### **Paso 4: Testing**

```bash
# Desplegar y probar
supabase functions deploy alerts
```

### **OPCIÓN 2: Usar en nuevas Edge Functions**

Cuando crees nuevas Edge Functions, usa directamente el patrón:

```typescript
import { withTenantContext } from "../_shared/tenant-context";

export default withTenantContext(async (req, ctx) => {
  const { companyId } = ctx;
  // Tu lógica aquí...
});
```

### **OPCIÓN 3: Crear Edge Function de Demostración**

Vamos a crear una función simple para probar el middleware:

```typescript
// supabase/functions/test-tenant/index.ts
export default withTenantContext(async (req, ctx) => {
  const { companyId } = ctx;

  return new Response(
    JSON.stringify({
      message: "¡Middleware funcionando!",
      companyId: companyId,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});
```

## 🏆 **BENEFICIOS CONCRETOS**

### **Antes de withTenantContext:**

- ❌ 85+ líneas por Edge Function
- ❌ Código de autenticación repetido 22 veces
- ❌ Mantenimiento difícil
- ❌ Propenso a errores de copy-paste

### **Con withTenantContext:**

- ✅ 40-50 líneas por Edge Function (-50%)
- ✅ Autenticación centralizada
- ✅ Un solo lugar para cambios
- ✅ Código más limpio y legible

## 🎯 **RECOMENDACIÓN INMEDIATA**

1. **Crear función de prueba** (5 minutos)
2. **Convertir función alerts** (15 minutos)
3. **Medir diferencias** (benchmarking)
4. **Aplicar a resto gradualmente**

¿Quieres que creemos la función de prueba juntos?
