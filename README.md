# Portal Terralink

Portal interno de aplicaciones para Terralink.

## Características

- 🔐 Autenticación con Google OAuth (@terralink.cl)
- 📱 Diseño responsive con vista sidebar
- 🎨 Branding personalizado de Terralink
- 🚀 Construido con React, TypeScript y Vite
- 💅 Estilizado con Tailwind CSS
- ✅ Validación de sesión cada 30 minutos

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
src/
├── components/       # Componentes React
│   ├── Auth/        # Componentes de autenticación
│   ├── Layout/      # Componentes de diseño (Navbar)
│   └── Portal/      # Componentes del portal
├── contexts/        # Contextos de React (AuthContext)
├── lib/            # Constantes y utilidades
├── pages/          # Páginas de la aplicación
└── types/          # Definiciones de TypeScript
```

## Roles de Usuario

- `admin` - Acceso completo
- `operaciones` - Aplicaciones de O&M
- `ventas` - Aplicaciones de ventas
- `usuario` - Aplicaciones básicas (por defecto)

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

## Licencia

Propiedad de Terralink. Todos los derechos reservados.