# 🚀 Flujo Completo: Login → Dashboard - Análisis Función por Función

## 🎯 Índice

1. [**Resumen del Flujo Completo**](#resumen-del-flujo-completo)
2. [**Fase 1: Proceso de Login**](#fase-1-proceso-de-login)
3. [**Fase 2: Inicialización de Contextos**](#fase-2-inicialización-de-contextos)
4. [**Fase 3: Carga del Dashboard**](#fase-3-carga-del-dashboard)
5. [**Datos en Cada Etapa**](#datos-en-cada-etapa)
6. [**Mapa de Datos Completo**](#mapa-de-datos-completo)

---

## 📊 Resumen del Flujo Completo

```mermaid
graph TD
    A[Usuario hace Login] --> B[AuthContext.login()]
    B --> C[Login Edge Function]
    C --> D[Supabase Auth + Users Table]
    D --> E[Respuesta con Session + User]
    E --> F[AuthContext establece estado]
    F --> G[CompanyContext detecta cambio]
    G --> H[CompanyContext carga empresa]
    H --> I[HomeScreen se renderiza]
    I --> J[Services.Data.Dashboard.getData()]
    J --> K[dashboardService con cache]
    K --> L[EdgeFunctions.dashboard.getData()]
    L --> M[Dashboard Edge Function]
    M --> N[Múltiples consultas DB paralelas]
    N --> O[Respuesta consolidada]
    O --> P[Cache + UI actualizada]
```

---

## 🔐 Fase 1: Proceso de Login

### **1️⃣ `AuthContext.login({ email, contrasena })` - Entrada del Usuario**

**📥 DATOS DE ENTRADA:**

```javascript
{
  email: "usuario@empresa.com",
  contrasena: "contraseña123"
}
```

**🔄 PROCESO INTERNO:**

```javascript
// Fase 1: Preparación
setLoading(true);
const loginData = {
  email: email.trim(),
  contrasena,
};

// Fase 2: Llamada a Edge Function (XMLHttpRequest)
const url = `${SUPABASE_URL}/functions/v1/login/auth/login?apikey=${ANON_KEY}`;
xhr.open("POST", url);
xhr.setRequestHeader("Content-Type", "application/json");
xhr.send(JSON.stringify(loginData));
```

**📤 DATOS DE SALIDA:** Request a Edge Function

---

### **2️⃣ Login Edge Function - `loginUser(loginData)` - Procesamiento Servidor**

**📥 DATOS DE ENTRADA:**

```javascript
{
  email: "usuario@empresa.com",
  contrasena: "contraseña123"
}
```

**🔄 PROCESO INTERNO:**

#### **Validación de Entrada**

```javascript
if (!validateEmail(email)) {
  throw new Error("Email inválido");
}

if (!validatePassword(contrasena)) {
  throw new Error("Contraseña debe tener al menos 8 caracteres");
}
```

#### **Autenticación con Supabase Auth**

```javascript
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_ANON_KEY")
);

const { data: authData, error: authError } =
  await supabaseClient.auth.signInWithPassword({
    email: email,
    password: contrasena,
  });
```

**📤 DATOS AUTH RESPONSE:**

```javascript
{
  user: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "usuario@empresa.com",
    created_at: "2025-08-06T10:00:00Z",
    user_metadata: { /* metadata del usuario */ }
  },
  session: {
    access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    refresh_token: "v1.MRjVnvlxrj_dKCBOb7kJc5RtIfvT...",
    expires_at: 1691322000,
    expires_in: 3600
  }
}
```

#### **Obtener Perfil de Users Table**

```javascript
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

const { data: userData } = await supabaseAdmin
  .from("users")
  .select("*")
  .eq("id", authData.user.id)
  .single();
```

**📤 DATOS USER PROFILE:**

```javascript
{
  id: "123e4567-e89b-12d3-a456-426614174000",
  nombre: "Juan Pérez",
  email: "usuario@empresa.com",
  company_id: "company-uuid-456",
  rol: "admin",
  is_active: true,
  fecha_registro: "2025-01-15T08:30:00Z",
  last_login: "2025-08-06T10:00:00Z",
  permissions: ["read", "write", "admin"],
  user_settings: {
    theme: "light",
    language: "es",
    notifications: true
  }
}
```

#### **Crear Token Personalizado**

```javascript
const payload = {
  id_usuario: userData.id,
  email: userData.email,
  nombre: userData.nombre,
  company_id: userData.company_id,
  rol: userData.rol,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 72 * 60 * 60,
};

const token = btoa(JSON.stringify(payload));
```

**📤 DATOS DE SALIDA FINAL:**

```javascript
{
  token: "eyJpZF91c3VhcmlvIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0...",
  user: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "usuario@empresa.com",
    nombre: "Juan Pérez",
    rol: "admin",
    company_id: "company-uuid-456",
  },
  supabase_session: {
    access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    refresh_token: "v1.MRjVnvlxrj_dKCBOb7kJc5RtIfvT...",
    expires_at: 1691322000,
  }
}
```

---

### **3️⃣ AuthContext - Procesamiento de Respuesta**

**📥 DATOS DE ENTRADA:** Response de Login Edge Function

**🔄 PROCESO INTERNO:**

```javascript
if (responseData.success && responseData.session) {
  // Guardar datos temporales
  tempUserDataFromLogin = {
    session: responseData.session,
    user: responseData.user,
    timestamp: Date.now(),
  };

  // Establecer sesión en Supabase
  await sb.auth.setSession({
    access_token: responseData.session.access_token,
    refresh_token: responseData.session.refresh_token,
  });
}
```

**📤 ESTADO ACTUALIZADO:**

```javascript
{
  user: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "usuario@empresa.com",
    nombre: "Juan Pérez",
    rol: "admin",
    company_id: "company-uuid-456",
  },
  session: {
    access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    refresh_token: "v1.MRjVnvlxrj_dKCBOb7kJc5RtIfvT...",
    expires_at: 1691322000,
  },
  isAuthenticated: true,
  loading: false,
  initializationState: {}
}
```

---

## 🏢 Fase 2: Inicialización de Contextos

### **4️⃣ CompanyContext - Detección de Cambio**

**📥 DATOS DE ENTRADA:** Estado de AuthContext actualizado

**🔄 PROCESO INTERNO:**

```javascript
useEffect(() => {
  // Dependency Gates
  if (!auth.isAuthenticated) {
    setLoading(false);
    return;
  }

  if (!auth.user || auth.loading) {
    return;
  }

  if (!auth.user.company_id) {
    setError("Usuario sin empresa asignada");
    setLoading(false);
    return;
  }

  // TODO está listo, cargar datos de empresa
  loadCompanyData();
}, [auth.isAuthenticated, auth.user, auth.loading]);
```

### **5️⃣ `loadCompanyData()` - Carga de Datos Empresariales**

**🔄 PROCESO INTERNO:**

```javascript
const [companyResult, usageResult] = await Promise.allSettled([
  EdgeFunctions.companies.getById(auth.user.company_id),
  EdgeFunctions.companies.getUsageStats(auth.user.company_id),
]);
```

**📤 DATOS DE EMPRESA:**

```javascript
{
  company: {
    id: "company-uuid-456",
    company_name: "Empresa Demo SL",
    company_code: "ED123456",
    subscription_plan: "pro",
    tax_rate: 21.0,
    default_currency: "EUR",
    max_users: 10,
    max_clients: 500,
    max_products: 1000,
    max_storage_mb: 500,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z"
  },
  usage: {
    users: 3,
    clients: 125,
    products: 245,
    appointments: 45,
    services: 12,
    storageMB: 89
  },
  loading: false,
  error: null
}
```

---

## 📊 Fase 3: Carga del Dashboard

### **6️⃣ HomeScreen - Renderizado e Inicialización**

**📥 DATOS DE ENTRADA:** Contextos listos (auth + company)

**🔄 PROCESO INTERNO:**

```javascript
useFocusEffect(
  useCallback(() => {
    if (isInitialLoad || !dashboardData) {
      fetchData();
    }
  }, [fetchData, isInitialLoad, dashboardData])
);

const fetchData = useCallback(async (forceRefresh = false) => {
  const data = await Services.Data.Dashboard.getData(forceRefresh);
  setDashboardData(data);
}, []);
```

### **7️⃣ `Services.Data.Dashboard.getData()` - Servicio de Cache**

**📥 DATOS DE ENTRADA:** forceRefresh = false

**🔄 PROCESO INTERNO:**

```javascript
// Control de concurrencia
if (pendingDashboardRequest && !forceRefresh) {
  return await pendingDashboardRequest;
}

// Usar sistema de cache
pendingDashboardRequest = adapter.withCache(
  "getData",
  "dashboard",
  () => this._fetchFromServer(),
  forceRefresh ? { skipCache: true } : {}
);
```

### **8️⃣ `_fetchFromServer()` - Llamada Real al Servidor**

**🔄 PROCESO INTERNO:**

```javascript
const result = await EdgeFunctions.dashboard.getData();
```

**👆 MAPEO:** `EdgeFunctions.dashboard.getData()` → `dashboardService.getData()`

### **9️⃣ `dashboardService.getData()` - Wrapper de Edge Function**

**🔄 PROCESO INTERNO:**

```javascript
const result = await callEdgeFunction("dashboard", {}, "GET", 2, true);
```

### **🔟 `callEdgeFunction("dashboard")` - Cliente HTTP**

**📥 DATOS DE ENTRADA:**

```javascript
{
  functionName: "dashboard",
  body: {},
  method: "GET"
}
```

**🔄 PROCESO INTERNO:**

```javascript
// Obtener token de sesión
const {
  data: { session },
} = await supabase.auth.getSession();
const token = session?.access_token;

// Configurar headers
const headers = {
  "Content-Type": "application/json",
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${token}`,
};

// Realizar llamada
const response = await fetch(`${supabaseUrl}/functions/v1/dashboard`, {
  method: "GET",
  headers,
});
```

**📤 HTTP REQUEST:**

```http
GET /functions/v1/dashboard HTTP/1.1
Host: kwuxtvgnzjqlrccftnru.supabase.co
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

---

## 🖥️ Fase 4: Procesamiento en Dashboard Edge Function

### **1️⃣1️⃣ Dashboard Edge Function - Handler Principal**

**📥 DATOS DE ENTRADA:** HTTP Request con headers de autenticación

**🔄 AUTENTICACIÓN:**

```javascript
// Verificar token
const authHeader = req.headers.get("authorization");
const { companyId, error: authError } = await getUserAndCompanyId(
  authHeader.replace("Bearer ", "")
);
```

**📤 DATOS DE AUTENTICACIÓN:**

```javascript
{
  companyId: "company-uuid-456",
  error: null
}
```

### **1️⃣2️⃣ Consultas Paralelas - Agregación de Datos**

**🔄 PROCESO INTERNO:**

```javascript
const [financialData, trendData, inventoryData, alertsData, ordersData] =
  await Promise.all([
    getFinancialData(companyId),
    getTrendData(companyId),
    getInventoryData(companyId),
    getAlertsData(companyId),
    getOrdersData(companyId),
  ]);
```

### **1️⃣3️⃣ `getFinancialData(companyId)` - Datos Financieros**

**📥 DATOS DE ENTRADA:** companyId = "company-uuid-456"

**🔄 PROCESO INTERNO:**

```javascript
const { data, error } = await supabaseAdmin.rpc("get_financial_summary", {
  p_company_id: companyId,
  p_days_current: 30,
  p_days_previous: 30,
});
```

**📤 DATOS DE SALIDA:**

```javascript
{
  ingresos_actual: 15750.50,
  ingresos_anterior: 12340.25,
  ingresos_anual: 145230.75,
  gastos_actual: 8920.30,
  gastos_anterior: 7650.80,
  gastos_anual: 89450.20,
  balance_actual: 6830.20,
  balance_anterior: 4689.45,
  balance_anual: 55780.55
}
```

### **1️⃣4️⃣ `getTrendData(companyId)` - Tendencias Temporales**

**📥 DATOS DE ENTRADA:** companyId = "company-uuid-456"

**🔄 PROCESO INTERNO:**

```javascript
// Generar fechas de los últimos 6 meses
const meses = [];
for (let i = 5; i >= 0; i--) {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() - i);

  meses.push({
    mes: fecha.toISOString().slice(0, 7) + "-01",
    ingresos: Math.random() * 10000, // En producción: consulta real DB
    gastos: Math.random() * 8000,
    balance: 0, // Calculado después
    etiqueta:
      i === 0
        ? "Este mes"
        : fecha.toLocaleDateString("es-ES", {
            month: "short",
            year: "2-digit",
          }),
    año: fecha.getFullYear(),
    mes_numero: fecha.getMonth() + 1,
  });
}

// Calcular balance
meses.forEach((mes) => {
  mes.balance = mes.ingresos - mes.gastos;
});
```

**📤 DATOS DE SALIDA:**

```javascript
[
  {
    mes: "2025-03-01",
    ingresos: 8543.25,
    gastos: 6234.8,
    balance: 2308.45,
    etiqueta: "mar 25",
    año: 2025,
    mes_numero: 3,
  },
  {
    mes: "2025-04-01",
    ingresos: 9876.5,
    gastos: 7123.9,
    balance: 2752.6,
    etiqueta: "abr 25",
    año: 2025,
    mes_numero: 4,
  },
  // ... más meses
  {
    mes: "2025-08-01",
    ingresos: 15750.5,
    gastos: 8920.3,
    balance: 6830.2,
    etiqueta: "Este mes",
    año: 2025,
    mes_numero: 8,
  },
];
```

### **1️⃣5️⃣ `getInventoryData(companyId)` - Datos de Inventario**

**📥 DATOS DE ENTRADA:** companyId = "company-uuid-456"

**🔄 PROCESO INTERNO:**

```javascript
const { data: productos } = await supabaseAdmin
  .from("inventory")
  .select("cantidad_actual, cantidad_minima, precio_unitario")
  .eq("company_id", companyId);

// Calcular estadísticas
const stats = {
  productos_total: productos.length,
  productos_bajo_stock: 0,
  valor_total: 0,
  productos_agotados: 0,
  productos_critico: 0,
  productos_bajo: 0,
  productos_adecuado: 0,
  productos_excedente: 0,
  // ... valores por categoría
};

productos.forEach((producto) => {
  const valor =
    (producto.cantidad_actual || 0) * (producto.precio_unitario || 0);
  stats.valor_total += valor;

  // Clasificación por stock
  if ((producto.cantidad_actual || 0) <= 0) {
    stats.productos_agotados++;
  } else if (
    (producto.cantidad_actual || 0) <=
    (producto.cantidad_minima || 0) * 0.2
  ) {
    stats.productos_critico++;
  }
  // ... más clasificaciones
});
```

**📤 DATOS DE SALIDA:**

```javascript
{
  productos_total: 245,
  productos_bajo_stock: 23,
  valor_total: 89750.50,
  productos_agotados: 5,
  productos_critico: 8,
  productos_bajo: 10,
  productos_adecuado: 180,
  productos_excedente: 42,
  valor_agotado: 0,
  valor_critico: 2340.80,
  valor_bajo: 5670.25,
  valor_adecuado: 65230.70,
  valor_excedente: 16508.75
}
```

### **1️⃣6️⃣ `getAlertsData(companyId)` - Alertas Pendientes**

**📥 DATOS DE ENTRADA:** companyId = "company-uuid-456"

**🔄 PROCESO INTERNO:**

```javascript
const { data } = await supabaseAdmin
  .from("alerts")
  .select("id_recordatorio, titulo, fecha_recordatorio, prioridad")
  .eq("company_id", companyId)
  .eq("estado", "pendiente")
  .order("fecha_recordatorio", { ascending: true })
  .limit(5);
```

**📤 DATOS DE SALIDA:**

```javascript
[
  {
    id_recordatorio: "alert-001",
    titulo: "Revisar inventario productos críticos",
    fecha_recordatorio: "2025-08-07T09:00:00Z",
    prioridad: "alta",
  },
  {
    id_recordatorio: "alert-002",
    titulo: "Reunión con proveedor XYZ",
    fecha_recordatorio: "2025-08-08T14:30:00Z",
    prioridad: "media",
  },
  {
    id_recordatorio: "alert-003",
    titulo: "Pago a proveedor ABC vence mañana",
    fecha_recordatorio: "2025-08-09T10:00:00Z",
    prioridad: "alta",
  },
];
```

### **1️⃣7️⃣ `getOrdersData(companyId)` - Datos de Pedidos**

**📥 DATOS DE ENTRADA:** companyId = "company-uuid-456"

**🔄 PROCESO INTERNO:**

```javascript
// Pedidos no finalizados
const { data: pedidos } = await supabaseAdmin
  .from("orders")
  .select("estado, total")
  .eq("company_id", companyId)
  .not("estado", "in", "(entregado,cancelado)");

// Pedidos recientes con proveedor
const { data: recientes } = await supabaseAdmin
  .from("orders")
  .select(
    `
    id_pedido,
    fecha_pedido,
    estado,
    total,
    suppliers(nombre_proveedor)
  `
  )
  .eq("company_id", companyId)
  .order("fecha_pedido", { ascending: false })
  .limit(3);

// Calcular estadísticas
const estadisticas = {};
let totalPendiente = 0;

(pedidos || []).forEach((pedido) => {
  const estado = pedido.estado || "pendiente";
  const total = parseFloat(pedido.total || "0");

  if (!estadisticas[estado]) {
    estadisticas[estado] = { cantidad: 0, total: 0 };
  }

  estadisticas[estado].cantidad++;
  estadisticas[estado].total += total;
  totalPendiente += total;
});
```

**📤 DATOS DE SALIDA:**

```javascript
{
  pendientes: 12,
  totalPendiente: 8750.40,
  recientes: [
    {
      id_pedido: "ORD-2025-001",
      fecha_pedido: "2025-08-05T11:30:00Z",
      estado: "pendiente",
      total: "1250.75",
      suppliers: { nombre_proveedor: "Proveedor ABC S.L." }
    },
    {
      id_pedido: "ORD-2025-002",
      fecha_pedido: "2025-08-04T16:45:00Z",
      estado: "procesando",
      total: "2340.50",
      suppliers: { nombre_proveedor: "Suministros XYZ" }
    },
    {
      id_pedido: "ORD-2025-003",
      fecha_pedido: "2025-08-03T09:15:00Z",
      estado: "pendiente",
      total: "890.25",
      suppliers: { nombre_proveedor: "Distribuciones DEF" }
    }
  ],
  estadisticas: {
    pendiente: { cantidad: 8, total: 5670.90 },
    procesando: { cantidad: 3, total: 2340.50 },
    enviado: { cantidad: 1, total: 739.00 }
  }
}
```

---

## 📤 Fase 5: Consolidación y Respuesta

### **1️⃣8️⃣ Dashboard Edge Function - Construcción de Respuesta**

**📥 DATOS DE ENTRADA:** Resultados de todas las consultas paralelas

**🔄 PROCESO INTERNO:**

```javascript
const dashboardData = {
  finanzas: {
    actual: {
      ingresos: parseFloat(financialData.ingresos_actual || "0"),
      gastos: parseFloat(financialData.gastos_actual || "0"),
      balance: parseFloat(financialData.balance_actual || "0"),
    },
    anterior: {
      ingresos: parseFloat(financialData.ingresos_anterior || "0"),
      gastos: parseFloat(financialData.gastos_anterior || "0"),
      balance: parseFloat(financialData.balance_anterior || "0"),
    },
    anual: {
      ingresos: parseFloat(financialData.ingresos_anual || "0"),
      gastos: parseFloat(financialData.gastos_anual || "0"),
      balance: parseFloat(financialData.balance_anual || "0"),
    },
  },
  tendenciaBalance: trendData.map((mes) => ({
    mes: mes.mes,
    ingresos: parseFloat(mes.ingresos || "0"),
    gastos: parseFloat(mes.gastos || "0"),
    balance: parseFloat(mes.balance || "0"),
    etiqueta: mes.etiqueta,
    año: parseInt(mes.año || "0"),
    mesNumero: parseInt(mes.mes_numero || "0"),
  })),
  inventario: {
    productosTotal: inventoryData.productos_total,
    productosBajoStock: inventoryData.productos_bajo_stock,
    valorTotal: inventoryData.valor_total,
    categorias: {
      agotados: inventoryData.productos_agotados,
      critico: inventoryData.productos_critico,
      bajo: inventoryData.productos_bajo,
      adecuado: inventoryData.productos_adecuado,
      excedente: inventoryData.productos_excedente,
      valores: {
        agotado: inventoryData.valor_agotado,
        critico: inventoryData.valor_critico,
        bajo: inventoryData.valor_bajo,
        adecuado: inventoryData.valor_adecuado,
        excedente: inventoryData.valor_excedente,
      },
    },
  },
  alertas: {
    pendientes: alertsData.length,
    proximas: alertsData,
  },
  pedidos: {
    pendientes: ordersData.pendientes,
    totalPendiente: ordersData.totalPendiente,
    recientes: ordersData.recientes,
    estadisticas: {
      porEstado: ordersData.estadisticas,
    },
  },
  // Datos adicionales con valores por defecto
  margenBruto: {
    actual: {
      /* valores por defecto */
    },
    anterior: {
      /* valores por defecto */
    },
  },
  productosRanking: {
    mas_vendidos_unidades: [],
    mas_vendidos_importe: [],
    menos_vendidos_unidades: [],
    menos_vendidos_importe: [],
  },
  rentabilidad: {
    mayor_rentabilidad_porcentaje: [],
    mayor_rentabilidad_total: [],
    menor_rentabilidad_porcentaje: [],
    menor_rentabilidad_total: [],
  },
  balanceProductosServicios: {
    resumen: {
      /* valores por defecto */
    },
    distribucion_diaria: [],
  },
};
```

**📤 HTTP RESPONSE:**

```json
{
  "finanzas": {
    "actual": {
      "ingresos": 15750.5,
      "gastos": 8920.3,
      "balance": 6830.2
    },
    "anterior": {
      "ingresos": 12340.25,
      "gastos": 7650.8,
      "balance": 4689.45
    },
    "anual": {
      "ingresos": 145230.75,
      "gastos": 89450.2,
      "balance": 55780.55
    }
  },
  "tendenciaBalance": [
    {
      "mes": "2025-03-01",
      "ingresos": 8543.25,
      "gastos": 6234.8,
      "balance": 2308.45,
      "etiqueta": "mar 25",
      "año": 2025,
      "mesNumero": 3
    }
    // ... más meses
  ],
  "inventario": {
    "productosTotal": 245,
    "productosBajoStock": 23,
    "valorTotal": 89750.5,
    "categorias": {
      "agotados": 5,
      "critico": 8,
      "bajo": 10,
      "adecuado": 180,
      "excedente": 42,
      "valores": {
        "agotado": 0,
        "critico": 2340.8,
        "bajo": 5670.25,
        "adecuado": 65230.7,
        "excedente": 16508.75
      }
    }
  },
  "alertas": {
    "pendientes": 3,
    "proximas": [
      {
        "id_recordatorio": "alert-001",
        "titulo": "Revisar inventario productos críticos",
        "fecha_recordatorio": "2025-08-07T09:00:00Z",
        "prioridad": "alta"
      }
      // ... más alertas
    ]
  },
  "pedidos": {
    "pendientes": 12,
    "totalPendiente": 8750.4,
    "recientes": [
      {
        "id_pedido": "ORD-2025-001",
        "fecha_pedido": "2025-08-05T11:30:00Z",
        "estado": "pendiente",
        "total": "1250.75",
        "suppliers": { "nombre_proveedor": "Proveedor ABC S.L." }
      }
      // ... más pedidos
    ],
    "estadisticas": {
      "porEstado": {
        "pendiente": { "cantidad": 8, "total": 5670.9 },
        "procesando": { "cantidad": 3, "total": 2340.5 },
        "enviado": { "cantidad": 1, "total": 739.0 }
      }
    }
  }
  // ... resto de datos
}
```

---

## 🔄 Fase 6: Retorno al Frontend

### **1️⃣9️⃣ Propagación hacia el Frontend**

**📥 HTTP RESPONSE** → **callEdgeFunction()** → **dashboardService.getData()** → **Services.Data.Dashboard.getData()** → **HomeScreen.fetchData()**

### **2️⃣0️⃣ HomeScreen - Actualización de Estado**

**📥 DATOS DE ENTRADA:** Respuesta completa del dashboard

**🔄 PROCESO INTERNO:**

```javascript
const fetchData = useCallback(async (forceRefresh = false) => {
  try {
    const data = await Services.Data.Dashboard.getData(forceRefresh);

    setDashboardData(data);
    setError(null);
    setIsInitialLoad(false);
  } catch (err) {
    setError("Error al cargar los datos");
  } finally {
    setIsLoading(false);
    setRefreshing(false);
  }
}, []);
```

**📤 ESTADO FINAL:**

```javascript
{
  dashboardData: {
    finanzas: { /* datos financieros */ },
    tendenciaBalance: [ /* datos de tendencia */ ],
    inventario: { /* datos de inventario */ },
    alertas: { /* alertas pendientes */ },
    pedidos: { /* datos de pedidos */ },
    // ... resto de datos
  },
  isLoading: false,
  refreshing: false,
  error: null,
  isInitialLoad: false
}
```

---

## 📊 Mapa de Datos Completo

### **🔍 Datos que Entran vs Datos que Salen en Cada Función**

| **Función**                          | **📥 Datos de Entrada**    | **🔄 Transformación**                 | **📤 Datos de Salida**     |
| ------------------------------------ | -------------------------- | ------------------------------------- | -------------------------- |
| **AuthContext.login()**              | `{ email, contrasena }`    | Validación + llamada Edge Function    | HTTP Request               |
| **Login Edge Function**              | `{ email, contrasena }`    | Auth + DB query + token creation      | `{ token, user, session }` |
| **AuthContext setState**             | `{ token, user, session }` | Establecer sesión + estado            | Estado autenticado         |
| **CompanyContext.loadCompanyData()** | `auth.user.company_id`     | Consultas paralelas empresa           | `{ company, usage }`       |
| **HomeScreen.fetchData()**           | Contextos listos           | Llamada a servicio                    | Request a dashboard        |
| **Dashboard Service**                | `forceRefresh`             | Cache management + Edge Function call | Datos del servidor         |
| **Dashboard Edge Function**          | `Authorization header`     | Auth + consultas paralelas DB         | Datos consolidados         |
| **getFinancialData()**               | `companyId`                | RPC `get_financial_summary`           | Datos financieros          |
| **getTrendData()**                   | `companyId`                | Cálculo de 6 meses                    | Array de tendencias        |
| **getInventoryData()**               | `companyId`                | Query inventory + stats               | Estadísticas inventario    |
| **getAlertsData()**                  | `companyId`                | Query alerts pendientes               | Array de alertas           |
| **getOrdersData()**                  | `companyId`                | Query orders + estadísticas           | Datos de pedidos           |
| **Consolidación Final**              | Todos los datos anteriores | Mapeo + formateo                      | Respuesta JSON completa    |
| **HomeScreen setState**              | Respuesta JSON             | Procesamiento + render                | UI actualizada             |

### **📈 Flujo de Transformación de Datos**

```mermaid
graph LR
    A[Credenciales Usuario] --> B[Auth Tokens]
    B --> C[User + Company Data]
    C --> D[Dashboard Request]
    D --> E[Multiple DB Queries]
    E --> F[Raw Data]
    F --> G[Processed Data]
    G --> H[JSON Response]
    H --> I[React State]
    I --> J[UI Components]
```

### **🎯 Puntos Críticos de Datos**

1. **🔐 Autenticación**: `{ email, password }` → `{ user, session, tokens }`
2. **🏢 Empresa**: `company_id` → `{ company_data, usage_stats }`
3. **📊 Dashboard**: `Authorization` → `{ financial, inventory, alerts, orders }`
4. **🎨 UI**: `JSON data` → `React components`

### **⚡ Optimizaciones de Datos**

- **Cache Layer**: Evita consultas redundantes
- **Consultas Paralelas**: `Promise.all()` para mejor performance
- **Datos por Defecto**: Fallbacks para datos faltantes
- **Control de Concurrencia**: Una sola petición activa por vez

---

## 🎯 Conclusión

Este flujo completo demuestra cómo **cada función transforma datos específicos** desde las credenciales del usuario hasta la interfaz renderizada, pasando por:

1. **Autenticación segura** con múltiples tokens
2. **Carga empresarial** con contexto aislado
3. **Agregación de datos** con consultas paralelas optimizadas
4. **Transformación y formateo** para consumo del frontend
5. **Renderizado dinámico** con datos en tiempo real

El sistema está diseñado para ser **eficiente, seguro y escalable**, manteniendo la integridad de los datos en cada etapa del proceso.
