# AG-PYMEs - Sistema de Gestión Integral para Pequeñas y Medianas Empresas

![AG-PYMEs Logo](../AG-PYMEs/assets/logo.png)

**AG-PYMEs** es una aplicación móvil multiplataforma desarrollada con React Native y Expo, diseñada específicamente para la gestión integral de pequeñas y medianas empresas. La aplicación proporciona herramientas completas para administrar ventas, inventario, empleados, finanzas, planificación y mucho más.

## 📚 Documentación del Proyecto

### 📋 Documentos Principales

- **[Despliegue y Pruebas](Despliegue_y_Pruebas.md)** - Guía completa de instalación, configuración y pruebas funcionales
- **[Diseño del Sistema](Diseño_AG-PYMEs.md)** - Arquitectura y diseño técnico
- **[Casos de Uso](Diagrama_Casos_de_Uso_AG-PYMEs.md)** - Especificaciones funcionales
- **[Documentación Técnica](APP_Documentation.md)** - Detalles de implementación

### 🛠️ Scripts de Despliegue

- `scripts/verify_system.ps1` - Verificación de prerrequisitos
- `scripts/start_all.ps1` - Inicio automático del sistema
- `scripts/run_tests.ps1` - Ejecución de pruebas básicas

### 🧪 Pruebas

- `tests/casos_prueba_detallados.md` - Casos de prueba exhaustivos
- **80 casos de prueba** ejecutados con **100% de éxito**
- Pruebas de caja negra en múltiples plataformas

## 🚀 Características Principales

### Dashboard Inteligente

- Panel de control con métricas en tiempo real
- Tarjetas de resumen financiero (ingresos, gastos, beneficios)
- Análisis de inventario y stock crítico
- Rankings de productos más vendidos
- Indicadores de rentabilidad y márgenes
- Sistema de alertas automáticas

### 💰 Punto de Venta (POS)

- **Ventas rápidas y eficientes**

  - Selección de productos y servicios
  - Escáner de códigos de barras integrado
  - Gestión de clientes con historial
  - Múltiples métodos de pago
  - Generación de facturas, presupuestos y abonos

- **Impresión térmica**
  - Conectividad Bluetooth con impresoras térmicas
  - Tickets personalizables
  - Recibos automáticos

### 📦 Gestión de Inventario

- **Control de productos**

  - Catálogo completo de productos
  - Gestión de stock y alertas de inventario bajo
  - Categorización y filtrado avanzado
  - Precios y costos por producto

- **Gestión de pedidos**
  - Seguimiento de pedidos a proveedores
  - Estados de pedidos (pendiente, recibido, cancelado)
  - Historial completo de transacciones

### 👥 Gestión de Personal

- **Empleados**

  - Base de datos completa de empleados
  - Información de contacto y roles
  - Gestión de documentos y archivos

- **Planificación de turnos**
  - Calendario de turnos por empleado
  - Vista diaria y semanal
  - Exportación de horarios a CSV
  - Envío de horarios por email
  - Copia automática de semanas anteriores

### 📅 Sistema de Citas

- **Gestión de citas**
  - Calendario interactivo para servicios
  - Asignación de empleados a citas
  - Estados de citas (confirmada, cancelada, completada)
  - Verificación de disponibilidad automática

### 💼 Servicios Empresariales

- **Catálogo de servicios**
  - Servicios con múltiples niveles de calidad
  - Precios diferenciados por nivel
  - Categorización y estados activo/inactivo

### 🏢 Clientes

- **Base de datos de clientes**
  - Información completa de contacto
  - Historial de compras y servicios
  - Comunicación directa (llamadas, emails)

### 💹 Gestión Financiera

- **Ingresos y gastos**
  - Registro detallado de transacciones
  - Categorización de ingresos y gastos
  - Análisis de flujo de caja
  - Reportes financieros

### ⚙️ Configuración y Personalización

- **Configuración empresarial**

  - Datos de la empresa (nombre, dirección, teléfono)
  - Logo personalizable
  - Horarios de apertura y cierre
  - Configuración del backend

- **Temas y apariencia**
  - Tema claro y oscuro
  - Interfaz adaptativa para móvil y web
  - Diseño responsive

### 🔔 Sistema de Alertas

- Alertas de stock bajo
- Notificaciones de citas próximas
- Recordatorios de tareas pendientes
- Estado del sistema

## 🛠️ Tecnologías Utilizadas

### Frontend (Aplicación Móvil)

- **React Native 0.79.2** - Framework principal
- **Expo 53.0.0** - Plataforma de desarrollo
- **React Navigation 7.x** - Navegación entre pantallas
- **React Native Paper 5.13.1** - Componentes UI Material Design
- **React Native Reanimated 3.17.4** - Animaciones avanzadas
- **Axios 1.8.2** - Cliente HTTP para API
- **AsyncStorage** - Almacenamiento local
- **Expo Camera** - Funcionalidad de cámara y scanner
- **React Native Gifted Charts** - Gráficos y visualizaciones

### Backend (API REST)

- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos principal
- **JWT** - Autenticación y autorización
- **Multer** - Subida de archivos
- **CORS** - Configuración de acceso cruzado

### Herramientas de Desarrollo

- **ESLint** - Linting de código
- **Babel** - Transpilación de JavaScript
- **Metro** - Bundler de React Native
- **TypeScript** - Tipado estático (parcial)

## 📱 Plataformas Soportadas

- **iOS** (iPhone y iPad)
- **Android** (Teléfonos y tablets)
- **Web** (Navegadores modernos)

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ LTS
- PostgreSQL 12+
- Expo CLI
- Git

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd AppGestionPYMEs
```

### 2. Configurar el Backend

```bash
cd backend
npm install

# Configurar base de datos PostgreSQL
# Editar archivo .env con las credenciales de la base de datos
```

### 3. Configurar el Frontend

```bash
cd AG-PYMEs
npm install

# Configurar archivo .env con la URL del backend
```

### 4. Scripts de Ejecución

El proyecto incluye scripts PowerShell para facilitar el desarrollo:

```bash
# Iniciar todo el sistema
.\scripts\start_all.ps1

# Iniciar solo el backend
.\scripts\start_backend.ps1

# Iniciar solo el frontend
.\scripts\start_frontend.ps1

# Detener servicios
.\scripts\stop_backend.ps1
.\scripts\stop_frontend.ps1
```

## 📖 Guía de Uso

### Primer Inicio

1. **Registro/Login**: Crea una cuenta o inicia sesión
2. **Configuración inicial**: Configura los datos de tu empresa
3. **Importar datos**: Añade productos, servicios y empleados
4. **Personalización**: Ajusta el tema y configuraciones

### Operaciones Diarias

- **Ventas**: Utiliza el punto de venta para transacciones
- **Inventario**: Revisa stock y gestiona pedidos
- **Citas**: Programa y gestiona servicios
- **Turnos**: Asigna horarios a empleados

## 🏗️ Arquitectura del Proyecto

```
AG-PYMEs/
├── 📱 Frontend (React Native + Expo)
│   ├── 🧩 components/          # Componentes reutilizables
│   ├── 📺 screens/            # Pantallas de la aplicación
│   ├── 🔄 navigation/         # Configuración de navegación
│   ├── 🎨 context/            # Gestión de estado global
│   ├── 🔧 hooks/              # Hooks personalizados
│   ├── 🌐 api/                # Servicios y comunicación API
│   └── 🛠️ utils/              # Utilidades y helpers

├── 🖥️ Backend (Node.js + Express)
│   ├── 🎯 controllers/        # Lógica de negocio
│   ├── 🛣️ routes/             # Definición de rutas API
│   ├── 🔒 middleware/         # Middleware de autenticación
│   ├──    models/             # Modelos de base de datos
│   └── 🔧 utils/              # Utilidades del servidor

└── 📚 docs/                   # Documentación del proyecto
```

## 🔧 Configuración Avanzada

### Variables de Entorno

**Frontend (.env)**

```env
BACKEND_HOST=http://localhost:3000
NGROK_HOST=https://your-ngrok-url.ngrok.io
```

**Backend (.env)**

```env
PORT=3000
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=ag_pymes_db
JWT_SECRET=your_jwt_secret
```

### Base de Datos

La aplicación utiliza PostgreSQL con las siguientes tablas principales:

- `usuarios` - Gestión de usuarios
- `empleados` - Información de empleados
- `productos` - Catálogo de productos
- `servicios` - Catálogo de servicios
- `clientes` - Base de datos de clientes
- `ventas` - Registro de ventas
- `citas` - Sistema de citas
- `turnos` - Planificación de horarios

## 🧪 Testing

```bash
# Ejecutar tests del frontend
cd AG-PYMEs
npm test

# Ejecutar tests del backend
cd backend
npm test

# Análisis de código muerto
npm run detect-dead-code
```

## Performance

- **Carga inicial**: < 3 segundos
- **Navegación**: Transiciones fluidas con animaciones
- **Sincronización**: Actualizaciones en tiempo real
- **Offline**: Funcionalidad básica sin conexión

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Desarrollado por

**Proyecto de Fin de Grado - Ilerna**

- Desarrollo completo de aplicación móvil multiplataforma
- Sistema de gestión integral para PYMEs
- Implementación de arquitectura escalable

## 📞 Soporte

Para soporte técnico o consultas:

- 📧 Email: soporte@ag-pymes.com
- 📱 Teléfono: +34 XXX XXX XXX
- 💬 Chat: Disponible en la aplicación

---

⭐ Si este proyecto te ha sido útil, ¡no olvides darle una estrella!
