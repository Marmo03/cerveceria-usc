# 🚀 SETUP COMPLETO - Cervecería USC

## ⚠️ IMPORTANTE: Guía para ejecutar el proyecto desde cero

Esta guía garantiza que **CUALQUIER persona** pueda clonar el repositorio y ejecutar la aplicación sin problemas.

---

## 📋 **REQUISITOS PREVIOS**

Antes de comenzar, asegúrate de tener instalado:

### ✅ Software Requerido

1. **Node.js 18+** y **npm 9+**
   - Descargar: https://nodejs.org/
   - Verificar versión:
     ```powershell
     node --version   # Debe ser >= v18.0.0
     npm --version    # Debe ser >= 9.0.0
     ```

2. **PostgreSQL 16**
   - Descargar: https://www.postgresql.org/download/
   - Durante instalación, anotar:
     - Usuario: `postgres` (por defecto)
     - Contraseña: (la que elijas)
     - Puerto: `5433` (recomendado) o `5432`

3. **Git**
   - Descargar: https://git-scm.com/downloads
   - Verificar:
     ```powershell
     git --version
     ```

4. **Editor de Código** (recomendado)
   - VS Code: https://code.visualstudio.com/

---

## 📥 **PASO 1: CLONAR EL REPOSITORIO**

```powershell
# 1. Navegar a donde quieras guardar el proyecto
cd C:\Users\TU_USUARIO\Documents

# 2. Clonar el repositorio
git clone https://github.com/Marmo03/cerveceria-usc.git

# 3. Entrar al directorio
cd cerveceria-usc

# 4. Cambiarse a la rama correcta
git checkout feat/fullstack-bootstrap

# 5. Hacer pull para asegurar última versión
git pull origin feat/fullstack-bootstrap
```

---

## 📦 **PASO 2: INSTALAR DEPENDENCIAS**

```powershell
# Desde la raíz del proyecto (cerveceria-usc/)
npm install

# Esto instalará dependencias para:
# - Root (monorepo tools)
# - packages/backend
# - packages/frontend
```

**Espera** a que termine la instalación (puede tardar 2-5 minutos).

---

## 🗄️ **PASO 3: CONFIGURAR BASE DE DATOS**

### A. Crear la base de datos en PostgreSQL

```powershell
# Abrir PostgreSQL desde CMD/PowerShell
psql -U postgres -p 5433

# Dentro de psql, ejecutar:
CREATE DATABASE cerveceria_usc;
CREATE USER cerveceria_user WITH PASSWORD 'cerveceria_password';
GRANT ALL PRIVILEGES ON DATABASE cerveceria_usc TO cerveceria_user;
\q
```

### B. Configurar variables de entorno

```powershell
# 1. Navegar a packages/backend
cd packages/backend

# 2. Copiar el archivo de ejemplo
Copy-Item .env.example .env

# 3. Editar .env con tu editor preferido
# Asegúrate que DATABASE_URL tenga el puerto correcto (5433 o 5432)
```

**Archivo `.env` debe contener:**
```env
DATABASE_URL="postgresql://cerveceria_user:cerveceria_password@localhost:5433/cerveceria_usc?schema=public"
PORT=3001
JWT_SECRET="super-secret-jwt-key-for-cerveceria-usc-marmo-development-2024"
JWT_EXPIRES_IN="24h"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV=development
LOG_LEVEL="debug"
```

### C. Ejecutar migraciones

```powershell
# Aún en packages/backend
npx prisma generate
npx prisma db push

# Esto creará todas las tablas en la base de datos
```

### D. Poblar datos de prueba (seed)

```powershell
npm run db:seed
```

**✅ Usuarios creados:**
- `admin@cerveceria-usc.edu.co` / `123456` (ADMIN)
- `operario@cerveceria-usc.edu.co` / `123456` (OPERARIO)
- `aprobador@cerveceria-usc.edu.co` / `123456` (APROBADOR)
- `analista@cerveceria-usc.edu.co` / `123456` (ANALISTA)

---

## 🖥️ **PASO 4: CONFIGURAR FRONTEND**

```powershell
# 1. Navegar a packages/frontend
cd ..\frontend

# 2. Copiar variables de entorno (si existe .env.example)
# Normalmente no es necesario para desarrollo local
```

---

## ▶️ **PASO 5: EJECUTAR LA APLICACIÓN**

### Opción A: Dos terminales separadas (Recomendado)

**Terminal 1 - Backend:**
```powershell
cd packages/backend
npm run dev
```

Verás algo como:
```
✅ Server listening at http://localhost:3001
✅ Database connected successfully
```

**Terminal 2 - Frontend:**
```powershell
cd packages/frontend
npm run dev
```

Verás algo como:
```
VITE v5.0.0  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Opción B: Un solo comando (desde raíz)

```powershell
# Desde la raíz del proyecto
npm run dev
```

Este comando ejecuta backend y frontend simultáneamente.

---

## 🌐 **PASO 6: ACCEDER A LA APLICACIÓN**

### 🎉 ¡LISTO!

Abre tu navegador en:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Prisma Studio** (opcional): http://localhost:5555

### 🔐 Iniciar sesión

Usa cualquiera de estos usuarios:
```
Email: admin@cerveceria-usc.edu.co
Password: 123456
```

---

## 🔧 **SOLUCIÓN DE PROBLEMAS COMUNES**

### ❌ Error: "Puerto 3001 ya está en uso"

```powershell
# Encontrar proceso
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess

# Matar proceso
Stop-Process -Id NUMERO_DE_PROCESO -Force
```

### ❌ Error: "Puerto 5173 ya está en uso"

```powershell
Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess
Stop-Process -Id NUMERO_DE_PROCESO -Force
```

### ❌ Error: "Cannot connect to database"

1. Verificar que PostgreSQL esté corriendo:
   ```powershell
   Get-Service -Name postgresql*
   ```

2. Verificar puerto correcto en `.env` (5432 o 5433)

3. Probar conexión manualmente:
   ```powershell
   psql -U cerveceria_user -d cerveceria_usc -p 5433
   ```

### ❌ Error: "Prisma Client not generated"

```powershell
cd packages/backend
npx prisma generate
```

### ❌ Error: "Module not found" o dependencias

```powershell
# Limpiar todo y reinstalar
Remove-Item -Recurse -Force node_modules, packages/*/node_modules
npm install
```

### ❌ Frontend muestra "Sin nombre" en productos

1. Verificar que backend esté corriendo
2. Abrir DevTools (F12) y ver errores en Console
3. Verificar que `.env` tenga `CORS_ORIGIN="http://localhost:5173"`

---

## 📊 **VERIFICAR QUE TODO FUNCIONA**

### ✅ Checklist Final

- [ ] Backend responde en http://localhost:3001
- [ ] Frontend carga en http://localhost:5173
- [ ] Puedes iniciar sesión con `admin@cerveceria-usc.edu.co`
- [ ] Dashboard muestra datos
- [ ] Módulo de Productos funciona
- [ ] Módulo de Inventario funciona
- [ ] Módulo de KPIs muestra gráficas

---

## 🎯 **COMANDOS ÚTILES**

### Base de Datos

```powershell
cd packages/backend

# Ver datos en interfaz gráfica
npm run db:studio

# Resetear base de datos (¡CUIDADO! Borra todo)
npm run db:reset

# Re-ejecutar seed
npm run db:seed
```

### Desarrollo

```powershell
# Desde raíz - Ejecutar todo
npm run dev

# Desde backend - Solo API
cd packages/backend && npm run dev

# Desde frontend - Solo UI
cd packages/frontend && npm run dev
```

### Testing

```powershell
# Backend tests
cd packages/backend
npm run test

# Frontend tests
cd packages/frontend
npm run test
```

### Linting y Formato

```powershell
# Verificar código
npm run lint

# Corregir automáticamente
npm run lint:fix
```

---

## 📚 **DOCUMENTACIÓN ADICIONAL**

- **README.md** - Información general del proyecto
- **packages/backend/README.md** - Documentación del backend
- **packages/frontend/README.md** - Documentación del frontend
- **docs/** - Documentación técnica y ADRs

---

## 🆘 **¿NECESITAS AYUDA?**

1. **Revisar errores en consola** (F12 en navegador)
2. **Ver logs del backend** en la terminal
3. **Crear un Issue** en GitHub con:
   - Sistema operativo
   - Versiones de Node y npm
   - Error completo (captura de pantalla)
   - Pasos que seguiste

---

## 🎉 **¡PROYECTO CORRIENDO!**

Si llegaste hasta aquí y todo funciona, ¡felicidades! 🎊

Ahora puedes:
- Explorar el código
- Hacer cambios
- Crear nuevas funcionalidades
- Contribuir al proyecto

**Happy Coding! 🚀**
