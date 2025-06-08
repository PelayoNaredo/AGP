# AG-PYMEs - Documentación Técnica Detallada

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Documentación de la API](#documentación-de-la-api)
3. [Documentación de Componentes](#documentación-de-componentes)
4. [Gestión de Estado](#gestión-de-estado)
5. [Autenticación y Seguridad](#autenticación-y-seguridad)
6. [Base de Datos](#base-de-datos)
7. [Patrones de Diseño](#patrones-de-diseño)
8. [Configuración del Entorno](#configuración-del-entorno)
9. [Testing](#testing)
10. [Despliegue](#despliegue)
11. [Solución de Problemas](#solución-de-problemas)

---

## Arquitectura del Sistema

### Estructura General

La aplicación AG-PYMEs sigue una arquitectura de tres capas:

```
┌─────────────────────────────────────┐
│            Frontend                 │
│        (React Native)               │
├─────────────────────────────────────┤
│            Backend                  │
│         (Node.js/Express)           │
├─────────────────────────────────────┤
│          Base de Datos              │
│          (PostgreSQL)               │
└─────────────────────────────────────┘
```

### Componentes Principales

#### Frontend (React Native/Expo)

- **Navegación**: React Navigation v6
- **Gestión de Estado**: Context API + Hooks
- **HTTP Client**: Axios
- **UI Components**: React Native Elements + Componentes Personalizados

#### Backend (Node.js)

- **Framework**: Express.js
- **ORM**: Sequelize
- **Autenticación**: JWT + bcrypt
- **Validación**: express-validator
- **Subida de Archivos**: Multer

#### Base de Datos

- **Motor**: PostgreSQL
- **Migraciones**: Sequelize CLI
- **Backup**: Scripts automáticos

---

## Documentación de la API

### Autenticación

#### POST `/api/login`

Autentica un usuario en el sistema.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt_token_aqui",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "role": "admin",
    "company_id": 1
  }
}
```

#### POST `/api/register`

Registra un nuevo usuario.

**Request Body:**

```json
{
  "email": "nuevo@ejemplo.com",
  "password": "contraseña123",
  "company_name": "Mi Empresa",
  "role": "admin"
}
```

### Ventas

#### GET `/api/sales`

Obtiene todas las ventas de la empresa.

**Query Parameters:**

- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `start_date`: Fecha inicio (YYYY-MM-DD)
- `end_date`: Fecha fin (YYYY-MM-DD)

**Response:**

```json
{
  "sales": [
    {
      "id": 1,
      "total": 150.00,
      "date": "2025-06-08T10:30:00Z",
      "client_id": 5,
      "employee_id": 2,
      "items": [...],
      "payment_method": "efectivo"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

#### POST `/api/sales`

Crea una nueva venta.

**Request Body:**

```json
{
  "client_id": 5,
  "employee_id": 2,
  "items": [
    {
      "product_id": 10,
      "quantity": 2,
      "price": 25.0
    }
  ],
  "payment_method": "tarjeta",
  "discount": 5.0,
  "tax": 8.5
}
```

### Inventario

#### GET `/api/inventory`

Obtiene todos los productos del inventario.

#### POST `/api/inventory`

Añade un nuevo producto al inventario.

#### PUT `/api/inventory/:id`

Actualiza un producto existente.

#### DELETE `/api/inventory/:id`

Elimina un producto del inventario.

### Empleados

#### GET `/api/employees`

Lista todos los empleados de la empresa.

#### POST `/api/employees`

Crea un nuevo empleado.

#### GET `/api/employees/:id/shifts`

Obtiene los turnos de un empleado específico.

### Citas

#### GET `/api/appointments`

Obtiene todas las citas programadas.

#### POST `/api/appointments`

Programa una nueva cita.

#### PUT `/api/appointments/:id`

Actualiza una cita existente.

---

## Documentación de Componentes

### Componentes Reutilizables

#### CustomButton

Botón personalizado con estilos consistentes.

**Props:**

```typescript
interface CustomButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}
```

**Uso:**

```jsx
<CustomButton
  title="Guardar"
  onPress={handleSave}
  variant="primary"
  loading={isLoading}
/>
```

#### CustomPicker

Selector personalizado con búsqueda integrada.

**Props:**

```typescript
interface CustomPickerProps {
  items: Array<{ label: string; value: any }>;
  selectedValue: any;
  onValueChange: (value: any) => void;
  placeholder?: string;
  searchable?: boolean;
}
```

#### BarcodeScanner

Componente para escaneo de códigos de barras.

**Props:**

```typescript
interface BarcodeScannerProps {
  onBarcodeScanned: (data: string) => void;
  isVisible: boolean;
  onClose: () => void;
}
```

#### AlertBox

Sistema de notificaciones personalizadas.

**Métodos:**

```typescript
AlertBox.show({
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string,
  duration?: number
});
```

### Pantallas Principales

#### HomeScreen

Pantalla principal con resumen de estadísticas.

**Estado:**

- Ventas del día
- Inventario bajo stock
- Citas próximas
- Alertas pendientes

#### SalesScreen

Gestión del punto de venta.

**Funcionalidades:**

- Scanner de productos
- Gestión de carrito
- Múltiples métodos de pago
- Impresión de tickets

#### InventoryScreen

Gestión de inventario completa.

**Funcionalidades:**

- CRUD de productos
- Control de stock
- Alertas de stock bajo
- Importación masiva

---

## Gestión de Estado

### Context Providers

#### AuthContext

Gestiona el estado de autenticación global.

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

#### ThemeContext

Gestiona el tema visual de la aplicación.

```typescript
interface ThemeContextType {
  theme: "light" | "dark";
  colors: ColorScheme;
  toggleTheme: () => void;
}
```

#### NotificationContext

Maneja las notificaciones push y locales.

```typescript
interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  clearAll: () => void;
  requestPermissions: () => Promise<boolean>;
}
```

### Custom Hooks

#### useNotifications

Hook para gestionar notificaciones.

```typescript
const useNotifications = () => {
  const registerForPushNotifications = async () => { ... };
  const scheduledNotification = (message: string, date: Date) => { ... };
  return { registerForPushNotifications, scheduledNotification };
};
```

#### useSettings

Hook para gestionar configuraciones de usuario.

```typescript
const useSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const updateSetting = (key: string, value: any) => { ... };
  return { settings, updateSetting };
};
```

---

## Autenticación y Seguridad

### JWT Implementation

La aplicación utiliza JSON Web Tokens para autenticación.

**Estructura del Token:**

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": 1,
    "email": "usuario@ejemplo.com",
    "company_id": 1,
    "role": "admin",
    "iat": 1652345678,
    "exp": 1652432078
  }
}
```

### Middleware de Autenticación

```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
};
```

### Roles y Permisos

- **admin**: Acceso completo al sistema
- **manager**: Gestión de empleados y reportes
- **employee**: Operaciones básicas de venta e inventario
- **viewer**: Solo lectura de reportes

---

## Base de Datos

### Esquema Principal

#### Tabla: users

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  company_id INTEGER REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: products

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  barcode VARCHAR(255),
  category_id INTEGER REFERENCES categories(id),
  company_id INTEGER REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: sales

```sql
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  total DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  employee_id INTEGER REFERENCES users(id),
  company_id INTEGER REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relaciones

- Una empresa puede tener múltiples usuarios
- Un usuario pertenece a una empresa
- Los productos están asociados a una empresa
- Las ventas relacionan empleados, clientes y productos

### Índices Recomendados

```sql
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_company_id ON products(company_id);
```

---

## Patrones de Diseño

### Repository Pattern

Para la gestión de datos en el backend:

```javascript
class SalesRepository {
  async findAll(companyId, filters = {}) {
    // Implementación
  }

  async findById(id) {
    // Implementación
  }

  async create(saleData) {
    // Implementación
  }

  async update(id, saleData) {
    // Implementación
  }

  async delete(id) {
    // Implementación
  }
}
```

### Service Layer

Para lógica de negocio:

```javascript
class SalesService {
  constructor(salesRepository) {
    this.salesRepository = salesRepository;
  }

  async processSale(saleData) {
    // Validaciones
    // Actualización de inventario
    // Creación de venta
    // Notificaciones
  }
}
```

### Factory Pattern

Para creación de componentes:

```javascript
const ComponentFactory = {
  createButton: (props) => <CustomButton {...props} />,
  createInput: (props) => <CustomInput {...props} />,
  createPicker: (props) => <CustomPicker {...props} />,
};
```

---

## Configuración del Entorno

### Variables de Entorno

#### Frontend (.env)

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

#### Backend (.env)

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agpymes_db
DB_USER=postgres
DB_PASS=password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Puerto del servidor
PORT=3000

# Entorno
NODE_ENV=development

# Almacenamiento
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Scripts de Configuración

#### Configuración Inicial

```powershell
# start_all.ps1
Write-Host "Iniciando AG-PYMEs..." -ForegroundColor Green

# Verificar dependencias
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js no está instalado"
    exit 1
}

if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm no está instalado"
    exit 1
}

# Instalar dependencias del backend
Write-Host "Instalando dependencias del backend..." -ForegroundColor Yellow
cd backend
npm install

# Instalar dependencias del frontend
Write-Host "Instalando dependencias del frontend..." -ForegroundColor Yellow
cd ../AG-PYMEs
npm install

# Volver al directorio raíz
cd ..

# Iniciar servicios
Write-Host "Iniciando servicios..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-File", "scripts/start_backend.ps1"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-File", "scripts/start_frontend.ps1"

Write-Host "AG-PYMEs iniciado correctamente" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8081" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
```

---

## Testing

### Estructura de Tests

```
tests/
├── backend/
│   ├── unit/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── services/
│   ├── integration/
│   │   └── api/
│   └── e2e/
└── frontend/
    ├── components/
    ├── screens/
    └── utils/
```

### Configuración Jest (Backend)

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "services/**/*.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
```

### Ejemplo de Test (Backend)

```javascript
// tests/backend/unit/controllers/salesController.test.js
const request = require("supertest");
const app = require("../../../backend/server");

describe("Sales Controller", () => {
  let authToken;

  beforeAll(async () => {
    // Setup de autenticación
    const loginResponse = await request(app).post("/api/login").send({
      email: "test@test.com",
      password: "password123",
    });

    authToken = loginResponse.body.token;
  });

  describe("GET /api/sales", () => {
    it("should return all sales for authenticated user", async () => {
      const response = await request(app)
        .get("/api/sales")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("sales");
      expect(Array.isArray(response.body.sales)).toBe(true);
    });
  });

  describe("POST /api/sales", () => {
    it("should create a new sale", async () => {
      const saleData = {
        client_id: 1,
        items: [{ product_id: 1, quantity: 2, price: 25.0 }],
        payment_method: "efectivo",
      };

      const response = await request(app)
        .post("/api/sales")
        .set("Authorization", `Bearer ${authToken}`)
        .send(saleData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.total).toBe(50.0);
    });
  });
});
```

### Testing Frontend (React Native)

```javascript
// tests/frontend/components/CustomButton.test.js
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CustomButton from "../../../AG-PYMEs/components/customButton";

describe("CustomButton", () => {
  it("renders correctly with title", () => {
    const { getByText } = render(
      <CustomButton title="Test Button" onPress={() => {}} />
    );

    expect(getByText("Test Button")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <CustomButton title="Test Button" onPress={mockOnPress} />
    );

    fireEvent.press(getByText("Test Button"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it("shows loading state when loading prop is true", () => {
    const { getByTestId } = render(
      <CustomButton
        title="Test Button"
        onPress={() => {}}
        loading={true}
        testID="custom-button"
      />
    );

    expect(getByTestId("loading-indicator")).toBeTruthy();
  });
});
```

---

## Despliegue

### Producción Backend

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: agpymes_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Producción Frontend

#### Build para Producción

```bash
# Expo Build
expo build:android --type apk
expo build:ios --type archive

# O usando EAS Build (recomendado)
eas build --platform android
eas build --platform ios
```

#### Configuración EAS

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.agpymes.com/api"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Solución de Problemas

### Problemas Comunes

#### 1. Error de Conexión a la Base de Datos

**Síntoma:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solución:**

```powershell
# Verificar que PostgreSQL esté ejecutándose
Get-Service postgresql*

# Iniciar PostgreSQL si no está ejecutándose
Start-Service postgresql-x64-14

# Verificar conexión
psql -h localhost -U postgres -d agpymes_db
```

#### 2. Token JWT Expirado

**Síntoma:** `403 Forbidden - Token inválido`

**Solución:**

```javascript
// En el frontend, implementar refresh automático
const refreshToken = async () => {
  try {
    const response = await api.post("/auth/refresh");
    const newToken = response.data.token;
    await AsyncStorage.setItem("token", newToken);
    return newToken;
  } catch (error) {
    // Redirigir a login
    navigation.navigate("Login");
  }
};
```

#### 3. Error de CORS

**Síntoma:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solución:**

```javascript
// En el backend, configurar CORS
const cors = require("cors");

app.use(
  cors({
    origin: ["http://localhost:8081", "exp://192.168.1.100:8081"],
    credentials: true,
  })
);
```

#### 4. Problema con Subida de Archivos

**Síntoma:** `File upload failed - File too large`

**Solución:**

```javascript
// Verificar configuración de Multer
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido"), false);
    }
  },
});
```

### Logs y Debugging

#### Configuración de Logging

```javascript
// utils/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "agpymes-backend" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

module.exports = logger;
```

#### Monitoreo de Performance

```javascript
// Middleware de monitoreo
const performanceMonitor = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);

    if (duration > 1000) {
      logger.warn(
        `Slow request detected: ${req.method} ${req.url} took ${duration}ms`
      );
    }
  });

  next();
};
```

### Comandos Útiles

#### Backup de Base de Datos

```powershell
# Crear backup
pg_dump -h localhost -U postgres -d agpymes_db > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# Restaurar backup
psql -h localhost -U postgres -d agpymes_db < backup_20250608_120000.sql
```

#### Limpieza de Logs

```powershell
# Limpiar logs antiguos (mayores a 30 días)
Get-ChildItem -Path "logs/" -Filter "*.log" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
```

#### Reset de Base de Datos

```powershell
# Recrear base de datos completamente
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS agpymes_db;"
psql -h localhost -U postgres -c "CREATE DATABASE agpymes_db;"
cd backend
npm run migrate
npm run seed
```

---

## Contacto y Soporte

Para soporte técnico o consultas sobre la implementación:

- **Email**: soporte@agpymes.com
- **Documentación**: [docs.agpymes.com](https://docs.agpymes.com)
- **Issues**: [GitHub Issues](https://github.com/agpymes/frontend/issues)

---

_Documentación actualizada: 8 de junio de 2025_
