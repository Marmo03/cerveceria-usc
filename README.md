# Cervecería USC

Sistema de gestión integral para Cervecería USC - Proyecto universitario desarrollado con tecnologías modernas.

## Stack Tecnológico

### Frontend

- **Vue.js 3** - Framework progresivo de JavaScript
- **Vite** - Build tool rápido y moderno
- **TypeScript** - Tipado estático para JavaScript

### Backend

- **Fastify** - Framework web rápido y eficiente
- **Prisma** - ORM moderno para Node.js
- **PostgreSQL 16** - Base de datos relacional

### Automatización

- **n8n** - Plataforma de automatización RPA
- **Docker** - Containerización de servicios

### Metodología

- **P2P (Peer-to-Peer)** - Metodología de desarrollo colaborativo
- **ADRs** - Architecture Decision Records para documentar decisiones técnicas

## Estructura del Proyecto

```
cerveceria-usc/
├── packages/
│   ├── frontend/          # Aplicación Vue.js
│   └── backend/           # API Fastify + Prisma
├── infra/
│   ├── docker-compose.yml # PostgreSQL + n8n
│   └── .env.example       # Variables de entorno
├── docs/
│   ├── p2p/              # Bitácoras metodología P2P
│   └── ADRs/             # Architecture Decision Records
├── .github/
│   ├── workflows/        # GitHub Actions CI/CD
│   ├── ISSUE_TEMPLATE/   # Templates para issues
│   └── PULL_REQUEST_TEMPLATE.md
└── CODEOWNERS           # Propietarios de código
```

## Inicio Rápido

### Prerrequisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker y Docker Compose
- Git

### Instalación

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/Marmo03/cerveceria-usc.git
   cd cerveceria-usc
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp infra/.env.example infra/.env
   # Editar infra/.env con tus configuraciones
   ```

4. **Iniciar servicios de infraestructura**

   ```bash
   npm run docker:up
   ```

5. **Configurar base de datos**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Iniciar modo desarrollo**
   ```bash
   npm run dev
   ```

### URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **n8n**: http://localhost:5678
- **Prisma Studio**: http://localhost:5555

## Scripts Disponibles

### Desarrollo

- `npm run dev` - Inicia frontend y backend en modo desarrollo
- `npm run dev:frontend` - Solo frontend
- `npm run dev:backend` - Solo backend

### Build y Producción

- `npm run build` - Construye ambos paquetes
- `npm run build:frontend` - Construye solo frontend
- `npm run build:backend` - Construye solo backend

### Testing

- `npm test` - Ejecuta todos los tests
- `npm run test:frontend` - Tests del frontend
- `npm run test:backend` - Tests del backend

### Linting

- `npm run lint` - Ejecuta linting en ambos paquetes
- `npm run lint:fix` - Corrige automáticamente problemas de linting

### Base de Datos

- `npm run db:migrate` - Ejecuta migraciones de Prisma
- `npm run db:seed` - Ejecuta seeders
- `npm run db:studio` - Abre Prisma Studio

### Docker

- `npm run docker:up` - Inicia servicios (PostgreSQL + n8n)
- `npm run docker:down` - Detiene servicios
- `npm run docker:logs` - Muestra logs de contenedores

### Git

- `npm run commit` - Commit interactivo con Conventional Commits

## Flujo de Trabajo (Workflow)

### Estructura de Branches

- `main` - Producción estable
- `develop` - Desarrollo integrado
- `feat/*` - Nuevas funcionalidades
- `fix/*` - Correcciones de bugs
- `docs/*` - Actualizaciones de documentación

### Conventional Commits

Este proyecto utiliza [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication system
fix: resolve database connection timeout
docs: update API documentation
style: format code with prettier
refactor: restructure user service
test: add unit tests for auth module
chore: update dependencies
```

### Metodología P2P

- **Bitácoras diarias**: Documentar progreso en `docs/p2p/`
- **Peer Reviews**: Todos los PRs requieren revisión
- **Pair Programming**: Sesiones colaborativas documentadas

## Arquitectura

### Frontend (Vue.js)

- **Composición API** - Patrón reactivo moderno
- **Vue Router** - Navegación SPA
- **Pinia** - Gestión de estado
- **Axios** - Cliente HTTP

### Backend (Fastify)

- **Arquitectura en capas** - Controladores, servicios, repositorios
- **Autenticación JWT** - Seguridad stateless
- **Validación de esquemas** - Fastify JSON Schema
- **Documentación OpenAPI** - Swagger integrado

### Base de Datos

- **PostgreSQL 16** - Base de datos principal
- **Prisma Schema** - Definición de modelos
- **Migraciones** - Control de versiones DB

## ADRs (Architecture Decision Records)

Las decisiones técnicas importantes se documentan en `docs/ADRs/`:

- [ADR-001: Elección de Vue.js para Frontend](docs/ADRs/ADR-001-vue-frontend.md)
- [ADR-002: Fastify como Framework Backend](docs/ADRs/ADR-002-fastify-backend.md)
- [ADR-003: Prisma como ORM](docs/ADRs/ADR-003-prisma-orm.md)

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feat/amazing-feature`)
3. Commit tus cambios (`npm run commit`)
4. Push a la rama (`git push origin feat/amazing-feature`)
5. Abre un Pull Request

### Guidelines

- Seguir [Conventional Commits](https://www.conventionalcommits.org/)
- Mantener cobertura de tests > 80%
- Documentar cambios en ADRs si es necesario
- Actualizar bitácoras P2P diarias

## CI/CD

GitHub Actions automatiza:

- **Linting** y formato de código
- **Tests** unitarios y de integración
- **Build** de ambos paquetes
- **Análisis de código** con SonarCloud
- **Deploy** automático a staging

## Documentación P2P

### Bitácoras Diarias

- Registrar en `docs/p2p/daily-logs/YYYY-MM-DD.md`
- Incluir: objetivos, progreso, blockers, aprendizajes

### Evidencia de Colaboración

- Screenshots de pair programming
- Registros de code reviews
- Comunicación del equipo

## Reportar Issues

Usa nuestros templates:

- [Bug Report](.github/ISSUE_TEMPLATE/bug.md)
- [Feature Request](.github/ISSUE_TEMPLATE/feature.md)

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Equipo

- **Lead Developer** - [@Marmo03](https://github.com/Marmo03)
- **Desarrollador 2** - [@colaborador](https://github.com/colaborador)

---

**Universidad**: USC - Gestión de Proyectos TI  
**Semestre**: 7  
**Año**: 2024
