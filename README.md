# Sistema ERP - Inventario y Ventas

Sistema completo de gestión con autenticación por roles, inventario, ventas y módulo para meseros.

## 🔐 Autenticación

El sistema cuenta con dos tipos de usuarios:

### Administrador (ADMIN)
- **Email:** admin@erp.com
- **Contraseña:** admin123
- **Acceso a:**
  - Dashboard
  - Inventario
  - Registro de Ventas

### Mesero (WAITER)
- **Email:** mesero@erp.com
- **Contraseña:** mesero123
- **Acceso a:**
  - Módulo de Meseros (tomar órdenes)
  - Historial de Pedidos (ver sus propias órdenes)

## 🚀 Instalación

```bash
# Instalar dependencias
bun install

# Configurar base de datos
bunx prisma migrate dev

# Poblar base de datos con datos de prueba
bunx prisma db seed

# Iniciar servidor de desarrollo
bun run dev
```

## 📁 Estructura

- `/dashboard` - Panel de control (Solo Admin)
- `/inventory` - Gestión de inventario (Solo Admin)
- `/sales` - Registro de ventas (Solo Admin)
- `/waiter` - Módulo de meseros - Tomar pedidos (Solo Meseros)
- `/waiter/orders` - Historial de pedidos del mesero (Solo Meseros)
- `/login` - Página de inicio de sesión

## 🔒 Seguridad

- Las contraseñas están hasheadas con bcrypt
- Las rutas están protegidas con middleware basado en roles
- Las sesiones se manejan con NextAuth.js y JWT

## 🛠️ Tecnologías

- Next.js 16
- NextAuth.js  (Autenticación)
- Prisma (ORM)
- SQLite (Base de datos)
- TailwindCSS (Estilos)
- TypeScript

## 📝 Notas

- Al iniciar sesión, el sistema redirige automáticamente según el rol del usuario
- Los meseros solo pueden acceder al módulo de órdenes
- Los administradores tienen acceso completo al sistema
