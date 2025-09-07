# Portal Terralink

Portal interno de aplicaciones para Terralink con autenticación segura y panel de administración.

## Características

- 🔐 **Autenticación Google OAuth** con restricción de dominios
- 👥 **Control de Acceso por Roles** (Admin, Customer, Default)
- 📊 **Panel de Administración** con gestión de usuarios y seguimiento de actividad
- 📱 **Diseño Responsive** con interfaz moderna
- 🔄 **Seguimiento de Actividad en Tiempo Real** para todas las interacciones
- 🌐 **Integración con Sub-Aplicaciones** con intercambio seguro de tokens
- 🎨 **Avatar con Fallback** usando iniciales cuando las imágenes fallan
- ✅ **Validación de sesión** cada 30 minutos

## Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Cuenta Google @terralink.cl

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/[tu-usuario]/terralink-portal-react.git
cd terralink-portal-react
```

2. Instalar dependencias:
```bash
npm install
```

3. Variables de entorno ya configuradas en `.env.local`

## Desarrollo

Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

El portal estará disponible en `http://localhost:6001`

## Construcción

Para construir para producción:
```bash
npm run build
```

Los archivos construidos estarán en el directorio `dist/`.

## Estructura del Proyecto

```
terralink-portal-react/
├── api/                    # Endpoints API Serverless
│   ├── auth/              # Endpoints de autenticación
│   ├── admin/             # Endpoints de administración
│   ├── activity/          # Seguimiento de actividad
│   └── lib/               # Utilidades compartidas
├── src/                    # Aplicación React
│   ├── components/        # Componentes UI
│   │   ├── Auth/         # Componentes de autenticación
│   │   ├── Common/       # Componentes comunes (UserAvatar)
│   │   ├── Layout/       # Componentes de diseño (Navbar)
│   │   └── Portal/       # Componentes del portal
│   ├── contexts/         # Contextos de React (AuthContext)
│   ├── lib/             # Constantes y utilidades
│   ├── pages/           # Páginas (Portal, Admin, SignIn)
│   └── types/           # Definiciones de TypeScript
├── tests/                 # Archivos de prueba
└── dist/                  # Salida de compilación
```

## Roles de Usuario

- `admin` - Acceso completo + Panel de administración
- `customer` - Acceso a aplicaciones de cliente
- `default` - Acceso básico (por defecto)

## Tecnologías

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Herramienta de construcción rápida
- **Tailwind CSS** - Framework de CSS
- **React Router** - Enrutamiento
- **Lucide React** - Iconos
- **Google OAuth** - Autenticación

## Rendimiento

| Métrica | Valor |
|---------|-------|
| Inicio desarrollo | ~200ms |
| Hot Reload | <100ms |
| Uso CPU | <1% |
| Memoria | ~100MB |

## Despliegue en Producción

### Vercel (Recomendado)

1. **Conectar repositorio en Vercel**
2. **Configurar variables de entorno:**
   - `VITE_GOOGLE_CLIENT_ID`
   - `JWT_SECRET` (mínimo 32 caracteres)
   - `ALLOWED_DOMAINS` (ej: terralink.com.br)
   - `ADMIN_EMAILS` (ej: admin@terralink.com.br)

3. **Desplegar:**
   ```bash
   vercel --prod
   ```

### Documentación Adicional

- [Guía de Despliegue](./DEPLOYMENT.md) - Instrucciones completas
- [Estructura API](./API_STRUCTURE.md) - Endpoints e integración
- [Configuración OAuth](./GOOGLE_OAUTH_SETUP.md) - Google OAuth
- [Documentación Auth](./AUTH_DOCUMENTATION.md) - Flujo de autenticación

## Panel de Administración

Los usuarios con rol `admin` tienen acceso al panel de administración con:
- Gestión de usuarios (ver, actualizar roles, revocar acceso)
- Registros de actividad (seguimiento de interacciones)
- Gestión de dominios permitidos
- Monitoreo de sesiones

Accede al panel haciendo clic en el botón "Admin" en la barra de navegación.

## Integración con Sub-Aplicaciones

Las sub-aplicaciones pueden integrarse con la API del portal:

```javascript
// Validar sesión
const response = await fetch('https://portal.terralink.com.br/api/auth/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Registrar actividad
await fetch('https://portal.terralink.com.br/api/activity/track', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    appId: 'app-id',
    appName: 'Nombre App',
    action: 'click'
  })
});
```

## Licencia

Propiedad de Terralink. Todos los derechos reservados.