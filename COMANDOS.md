# 🍺 Cervecería USC - Comandos Útiles

Una referencia rápida de comandos más utilizados durante el desarrollo de la plataforma de cadena de suministro.

## 🚀 **Setup Inicial (Solo una vez)**

```bash
# Opción 1: Setup automático (recomendado)
./setup.sh           # Linux/Mac
./setup.ps1          # Windows PowerShell

# Opción 2: Setup manual
git checkout feat/fullstack-bootstrap
npm install
cd packages/backend && npx prisma migrate dev --name init && npm run db:seed
```

## 🏃‍♂️ **Comandos Diarios**

### **Ejecutar Aplicación** (2 terminales)

```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev         # http://localhost:3000

# Terminal 2 - Frontend
cd packages/frontend
npm run dev         # http://localhost:5173
```

### **Login Rápido** (password: `123456`)

- **Admin:** `admin@cerveceria-usc.edu.co`
- **Operario:** `operario@cerveceria-usc.edu.co`
- **Aprobador:** `aprobador@cerveceria-usc.edu.co`
- **Analista:** `analista@cerveceria-usc.edu.co`

## 🛠️ **Desarrollo**

### **Backend**

```bash
cd packages/backend

# Desarrollo
npm run dev          # Servidor con hot-reload
npm run test         # Tests unitarios
npm run test:watch   # Tests en modo watch

# Base de datos
npm run db:seed      # Regenerar datos de prueba
npm run db:reset     # Resetear BD completamente
npm run db:studio    # GUI de base de datos

# Código
npm run lint         # Verificar código
npm run lint:fix     # Arreglar problemas automáticamente
```

### **Frontend**

```bash
cd packages/frontend

# Desarrollo
npm run dev          # Servidor con hot-reload
npm run build        # Build para producción
npm run preview      # Preview del build

# Código
npm run lint         # Verificar código
npm run lint:fix     # Arreglar problemas automáticamente
```

## 🌿 **Git Workflow**

### **Trabajar en Nueva Feature**

```bash
# 1. Actualizar rama base
git checkout feat/fullstack-bootstrap
git pull origin feat/fullstack-bootstrap

# 2. Crear rama de feature
git checkout -b feature/mi-nueva-funcionalidad

# 3. Desarrollar...
git add .
git commit -m "feat: descripción de mi funcionalidad"

# 4. Push y crear PR
git push origin feature/mi-nueva-funcionalidad
```

### **Commits Semánticos**

```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
style: cambios de formato
refactor: refactorización
test: agregar/modificar tests
chore: tareas de mantenimiento
```

## 🔧 **Solución de Problemas**

### **Puertos Ocupados**

```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process

# Linux/Mac
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:5173)
```

### **Dependencias Corruptas**

```bash
# Limpiar todo y reinstalar
rm -rf node_modules packages/*/node_modules package-lock.json
npm install
```

### **Base de Datos Corrupta**

```bash
cd packages/backend
rm prisma/dev.db
npx prisma migrate dev --name reset
npm run db:seed
```

### **Problemas de TypeScript**

```bash
# Backend
cd packages/backend
npx tsc --noEmit

# Frontend
cd packages/frontend
npx vue-tsc --noEmit
```

### **Problemas de Prisma**

```bash
cd packages/backend
npx prisma generate    # Regenerar cliente
npx prisma db push     # Forzar schema a BD
```

## 🧪 **Testing**

### **Ejecutar Tests**

```bash
cd packages/backend

# Todos los tests
npm run test

# Tests específicos
npm run test -- inventario-use-cases.test.ts

# Con coverage
npm run test:coverage

# En modo watch
npm run test:watch
```

### **Estructura de Tests Given-When-Then**

```typescript
describe("CU-INV-01: Registrar salida", () => {
  it("Given stock 50, When salida 10, Then stock=40", async () => {
    // Given - Setup del escenario de prueba
    const producto = createProductoWithStock(50);

    // When - Ejecutar la acción a probar
    const resultado = await useCase.execute({
      productoId: "prod-1",
      cantidad: 10,
      tipo: "SALIDA",
    });

    // Then - Verificar los resultados
    expect(resultado.stockNuevo).toBe(40);
  });
});
```

## 📊 **APIs Principales**

### **Autenticación**

```bash
POST /api/auth/login     # Login
POST /api/auth/refresh   # Refresh token
GET  /api/auth/me        # Perfil actual
```

### **Productos**

```bash
GET    /api/productos              # Listar
POST   /api/productos              # Crear (ADMIN)
PUT    /api/productos/:id          # Actualizar (ADMIN)
DELETE /api/productos/:id          # Eliminar (ADMIN)
```

### **Inventario**

```bash
GET  /api/inventario/movimientos   # Historial
POST /api/inventario/entrada       # Entrada (OPERARIO)
POST /api/inventario/salida        # Salida (OPERARIO)
```

## 📁 **Archivos Importantes**

### **❌ NO Tocar Sin Coordinación**

- `packages/backend/prisma/schema.prisma`
- `packages/backend/src/domain/entities.ts`
- `packages/frontend/src/stores/auth.ts`
- `packages/backend/prisma/seed.ts`

### **✅ Safe para Modificar**

- `packages/frontend/src/pages/` - Nuevas páginas
- `packages/frontend/src/components/` - Nuevos componentes
- `packages/backend/src/controllers/` - Nuevos endpoints
- `packages/backend/src/services/` - Nuevos casos de uso
- `packages/backend/src/tests/` - Tests adicionales

## 🆘 **Ayuda Rápida**

### **URLs Útiles**

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Prisma Studio:** http://localhost:5555 (tras `npm run db:studio`)

### **Documentación**

- **README.md** - Documentación completa del proyecto
- **SETUP.md** - Guía detallada para colaboradores
- **packages/backend/src/domain/** - Lógica de negocio
- **packages/frontend/src/pages/** - Páginas implementadas

### **Contacto**

- **GitHub Issues** - Para reportar bugs o solicitar features
- **Pull Requests** - Para contribuciones de código
- **README.md** - Información de contacto del equipo

---

**¡Guarda este archivo como referencia rápida durante el desarrollo! 🚀🍺**
