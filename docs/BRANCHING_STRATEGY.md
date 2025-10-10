# 🌲 Estrategia de Branches - Cervecería USC

Documentación de la estrategia de branching y flujo de trabajo con Git para el proyecto Cervecería USC.

## 🎯 Estrategia de Branching

### 📊 Git Flow Simplificado

Utilizamos una versión simplificada de Git Flow adaptada para el desarrollo universitario y metodología P2P:

```
main
├── develop
│   ├── feat/backend-bootstrap
│   ├── feat/frontend-bootstrap  
│   ├── feat/infra-docker
│   ├── feat/user-authentication
│   ├── fix/database-connection
│   └── docs/api-documentation
└── hotfix/critical-security-patch
```

## 🌿 Tipos de Branches

### 🏠 `main` - Producción Estable
- **Propósito**: Código estable listo para producción
- **Protección**: Branch protegida, requiere PR + reviews
- **Deploy**: Automático a staging/producción
- **Merges desde**: `develop`, `hotfix/*`

**Reglas**:
- ✅ Solo merges via Pull Request
- ✅ Requiere mínimo 1 review aprobado
- ✅ Debe pasar todos los checks de CI
- ✅ Tests de integración exitosos

### 🚧 `develop` - Integración de Desarrollo
- **Propósito**: Rama de integración para desarrollo activo
- **Protección**: Semi-protegida, requiere PR
- **Deploy**: Automático a entorno de desarrollo
- **Merges desde**: `feat/*`, `fix/*`, `docs/*`

**Reglas**:
- ✅ Pull Requests requeridos
- ✅ Tests unitarios deben pasar
- ✅ Review recomendado (no obligatorio)

### 🚀 `feat/*` - Nuevas Funcionalidades
- **Nomenclatura**: `feat/nombre-descriptivo`
- **Base**: `develop`
- **Merge hacia**: `develop`
- **Duración**: Corta (1-2 semanas máximo)

**Ejemplos**:
```bash
feat/backend-bootstrap      # Setup inicial del backend
feat/frontend-bootstrap     # Setup inicial del frontend
feat/infra-docker          # Configuración Docker
feat/user-authentication   # Sistema de autenticación
feat/brewery-management     # Gestión de cervecería
feat/n8n-integration       # Integración con n8n
```

### 🐛 `fix/*` - Corrección de Bugs
- **Nomenclatura**: `fix/descripcion-bug`
- **Base**: `develop` (bugs normales) o `main` (críticos)
- **Merge hacia**: `develop` y/o `main`

**Ejemplos**:
```bash
fix/database-connection     # Problema de conexión BD
fix/login-validation       # Error en validación login
fix/cors-configuration     # Problema CORS
```

### 📚 `docs/*` - Documentación
- **Nomenclatura**: `docs/tipo-documentacion`
- **Base**: `develop`
- **Merge hacia**: `develop`

**Ejemplos**:
```bash
docs/api-documentation     # Documentación API
docs/setup-guide          # Guía de instalación
docs/p2p-methodology      # Docs metodología P2P
```

### 🔥 `hotfix/*` - Correcciones Críticas
- **Nomenclatura**: `hotfix/descripcion-critica`
- **Base**: `main`
- **Merge hacia**: `main` Y `develop`
- **Uso**: Solo para bugs críticos en producción

## 🔄 Flujo de Trabajo

### 🚀 Para Nuevas Funcionalidades

1. **Crear Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/user-authentication
   ```

2. **Desarrollar**
   ```bash
   # Hacer commits frecuentes
   git add .
   git commit -m "feat(auth): add login endpoint"
   
   # Push regular para backup
   git push origin feat/user-authentication
   ```

3. **Mantener Actualizado**
   ```bash
   # Sincronizar con develop regularmente
   git checkout develop
   git pull origin develop
   git checkout feat/user-authentication
   git merge develop
   ```

4. **Pull Request**
   - Crear PR hacia `develop`
   - Llenar template completo
   - Solicitar review
   - Responder feedback

5. **Merge y Cleanup**
   ```bash
   # Después del merge
   git checkout develop
   git pull origin develop
   git branch -d feat/user-authentication
   ```

### 🐛 Para Bug Fixes

1. **Identificar Severidad**
   - **Normal**: Base en `develop`
   - **Crítico**: Base en `main` (hotfix)

2. **Crear Branch**
   ```bash
   git checkout develop  # o main para hotfix
   git pull origin develop
   git checkout -b fix/database-connection
   ```

3. **Desarrollar y Probar**
   ```bash
   git commit -m "fix(db): resolve connection timeout issue"
   ```

4. **Pull Request**
   - PR hacia `develop` (o `main` para hotfix)
   - Incluir pasos de reproducción
   - Evidencia de la corrección

## 📋 Convenciones de Nomenclatura

### 🏷️ Formato de Branches
```
<tipo>/<descripcion-kebab-case>
```

**Tipos permitidos**:
- `feat/` - Nueva funcionalidad
- `fix/` - Corrección de bug
- `docs/` - Documentación
- `style/` - Cambios de formato
- `refactor/` - Refactorización
- `test/` - Tests
- `chore/` - Tareas de mantenimiento
- `hotfix/` - Corrección crítica

### 📝 Ejemplos Correctos
```bash
feat/frontend-dashboard
feat/backend-api-auth
fix/cors-headers-issue
docs/installation-guide
refactor/user-service-cleanup
test/integration-auth-flow
chore/update-dependencies
hotfix/security-vulnerability
```

### ❌ Ejemplos Incorrectos
```bash
feature/newUserAuth        # Usar feat/, no feature/
bugfix/fix-database       # Usar fix/, no bugfix/
Frontend-Dashboard        # Usar kebab-case, no PascalCase
fix_database_issue        # Usar kebab-case, no snake_case
```

## 🛡️ Protección de Branches

### 🔒 Branch `main`
```yaml
# Configuración GitHub
Protection Rules:
  - Require pull request reviews: 1
  - Dismiss stale reviews: true
  - Require status checks: true
  - Require branches up to date: true
  - Restrict pushes: true
  - Allow force pushes: false
  - Allow deletions: false
```

### 🔐 Branch `develop`
```yaml
# Configuración GitHub
Protection Rules:
  - Require pull request reviews: false (recomendado)
  - Require status checks: true
  - Require branches up to date: true
  - Allow force pushes: false
  - Allow deletions: false
```

## 🤝 Metodología P2P en Branches

### 👥 Pair Programming
```bash
# Branch compartida para pair programming
git checkout -b feat/user-auth-pair-session
# Ambos desarrolladores trabajan en la misma branch
# Commits frecuentes con co-authorship
```

### 📝 Co-authorship en Commits
```bash
git commit -m "feat(auth): implement JWT validation

Co-authored-by: Developer2 <dev2@email.com>"
```

### 🔄 Branch Reviews
- Cada feature branch debe ser revisada por otro miembro
- Documentar aprendizajes en bitácora P2P
- Pair reviews para branches complejas

## 📊 Release Management

### 🏷️ Tagging Strategy
```bash
# Releases desde main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 📦 Release Branches (Opcional)
```bash
# Para releases grandes
git checkout -b release/v1.0.0 develop
# Preparación release
git checkout main
git merge release/v1.0.0
git tag v1.0.0
```

## 🔧 Configuración Local

### 📝 Git Config Recomendada
```bash
# Configuración para el proyecto
git config --local pull.rebase true
git config --local branch.autosetupmerge always
git config --local branch.autosetuprebase always

# Aliases útiles
git config --local alias.co checkout
git config --local alias.br branch
git config --local alias.ci commit
git config --local alias.st status
git config --local alias.unstage 'reset HEAD --'
git config --local alias.last 'log -1 HEAD'
git config --local alias.visual '!gitk'
```

### 🔄 Git Hooks
```bash
# Pre-commit hook (configurado por Husky)
# - Ejecuta lint-staged
# - Valida formato de código
# - Ejecuta tests rápidos

# Commit-msg hook (configurado por Husky)
# - Valida formato de commit (Conventional Commits)
```

## 📚 Recursos y Referencias

### 🔗 Enlaces Útiles
- [Git Flow Original](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### 📖 Comandos de Referencia Rápida
```bash
# Ver branches
git branch -a

# Cambiar branch
git checkout <branch-name>

# Crear y cambiar
git checkout -b <new-branch>

# Merge desde develop
git merge develop

# Push branch
git push origin <branch-name>

# Eliminar branch local
git branch -d <branch-name>

# Eliminar branch remota
git push origin --delete <branch-name>
```

---

**🎓 Metodología P2P**: Esta estrategia está diseñada para facilitar la colaboración peer-to-peer y el aprendizaje conjunto del equipo de desarrollo de Cervecería USC.