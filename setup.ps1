# 🍺 Cervecería USC - Script de Setup Automático (PowerShell)
# Este script configura el entorno completo para nuevos colaboradores en Windows

# Función para verificar si un comando existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Función para mostrar mensajes coloridos
function Write-ColorOutput($Message, $Color = "White") {
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "🍺 ======================================" "Cyan"
Write-ColorOutput "   Cervecería USC - Setup Automático" "Cyan"
Write-ColorOutput "=======================================" "Cyan"
Write-Host ""

# Verificar requisitos previos
Write-ColorOutput "📋 Verificando requisitos previos..." "Yellow"

# Verificar Node.js
if (-not (Test-Command "node")) {
    Write-ColorOutput "❌ Node.js no está instalado. Por favor instala Node.js 18+ desde https://nodejs.org/" "Red"
    exit 1
}

$nodeVersion = (node --version).TrimStart('v').Split('.')[0]
if ([int]$nodeVersion -lt 18) {
    Write-ColorOutput "❌ Node.js versión $nodeVersion detectada. Se requiere versión 18 o superior." "Red"
    exit 1
}

Write-ColorOutput "✅ Node.js $(node --version) detectado" "Green"

# Verificar npm
if (-not (Test-Command "npm")) {
    Write-ColorOutput "❌ npm no está instalado." "Red"
    exit 1
}

Write-ColorOutput "✅ npm $(npm --version) detectado" "Green"

# Verificar Git
if (-not (Test-Command "git")) {
    Write-ColorOutput "❌ Git no está instalado." "Red"
    exit 1
}

$gitVersion = (git --version).Split(' ')[2]
Write-ColorOutput "✅ Git $gitVersion detectado" "Green"
Write-Host ""

# Cambiar a la rama correcta
Write-ColorOutput "🌿 Configurando rama de desarrollo..." "Yellow"

try {
    git checkout feat/fullstack-bootstrap 2>$null
    Write-ColorOutput "✅ Rama feat/fullstack-bootstrap configurada" "Green"
} catch {
    Write-ColorOutput "❌ Error: No se pudo cambiar a la rama feat/fullstack-bootstrap" "Red"
    Write-ColorOutput "   Asegúrate de estar en el repositorio correcto y que la rama exista" "Red"
    exit 1
}

try {
    git pull origin feat/fullstack-bootstrap 2>$null
} catch {
    Write-ColorOutput "⚠️  Advertencia: No se pudo hacer pull. Continuando con la versión local..." "Yellow"
}

Write-Host ""

# Instalar dependencias
Write-ColorOutput "📦 Instalando dependencias..." "Yellow"
Write-ColorOutput "   Esto puede tomar varios minutos..." "Gray"

try {
    npm install
    Write-ColorOutput "✅ Dependencias del monorepo instaladas" "Green"
} catch {
    Write-ColorOutput "❌ Error instalando dependencias del monorepo" "Red"
    exit 1
}

# Configurar backend
Write-Host ""
Write-ColorOutput "🔧 Configurando backend..." "Yellow"
Set-Location "packages/backend"

try {
    npm install
    Write-ColorOutput "✅ Dependencias del backend instaladas" "Green"
} catch {
    Write-ColorOutput "❌ Error instalando dependencias del backend" "Red"
    exit 1
}

# Configurar base de datos
Write-ColorOutput "🗄️  Configurando base de datos SQLite..." "Yellow"

try {
    npx prisma generate
    Write-ColorOutput "✅ Cliente Prisma generado" "Green"
} catch {
    Write-ColorOutput "❌ Error generando cliente Prisma" "Red"
    exit 1
}

try {
    npx prisma migrate dev --name init
    Write-ColorOutput "✅ Migraciones de base de datos ejecutadas" "Green"
} catch {
    Write-ColorOutput "❌ Error ejecutando migraciones de base de datos" "Red"
    exit 1
}

# Poblar base de datos
Write-ColorOutput "🌱 Poblando base de datos con datos de prueba..." "Yellow"
try {
    npm run db:seed
    Write-ColorOutput "✅ Base de datos poblada con datos de prueba" "Green"
} catch {
    Write-ColorOutput "❌ Error poblando base de datos" "Red"
    exit 1
}

# Regresar al directorio raíz
Set-Location "../.."

# Configurar frontend
Write-Host ""
Write-ColorOutput "🎨 Configurando frontend..." "Yellow"
Set-Location "packages/frontend"

try {
    npm install
    Write-ColorOutput "✅ Dependencias del frontend instaladas" "Green"
} catch {
    Write-ColorOutput "❌ Error instalando dependencias del frontend" "Red"
    exit 1
}

# Regresar al directorio raíz
Set-Location "../.."

Write-Host ""
Write-ColorOutput "🎉 ======================================" "Cyan"
Write-ColorOutput "   ¡Setup completado exitosamente!" "Cyan"
Write-ColorOutput "=======================================" "Cyan"
Write-Host ""
Write-ColorOutput "🚀 Para ejecutar la aplicación:" "White"
Write-Host ""
Write-ColorOutput "   Terminal 1 (Backend API):" "Yellow"
Write-ColorOutput "   cd packages/backend" "Gray"
Write-ColorOutput "   npm run dev" "Gray"
Write-Host ""
Write-ColorOutput "   Terminal 2 (Frontend UI):" "Yellow"
Write-ColorOutput "   cd packages/frontend" "Gray"
Write-ColorOutput "   npm run dev" "Gray"
Write-Host ""
Write-ColorOutput "🌐 URLs una vez ejecutado:" "White"
Write-ColorOutput "   Frontend: http://localhost:5173" "Cyan"
Write-ColorOutput "   Backend:  http://localhost:3000" "Cyan"
Write-Host ""
Write-ColorOutput "🔑 Usuarios de prueba (password: 123456):" "White"
Write-ColorOutput "   admin@cerveceria-usc.edu.co      (Administrador)" "Green"
Write-ColorOutput "   operario@cerveceria-usc.edu.co   (Operario)" "Green"
Write-ColorOutput "   aprobador@cerveceria-usc.edu.co  (Aprobador)" "Green"
Write-ColorOutput "   analista@cerveceria-usc.edu.co   (Analista)" "Green"
Write-Host ""
Write-ColorOutput "📚 Recursos adicionales:" "White"
Write-ColorOutput "   - README.md  : Documentación completa" "Gray"
Write-ColorOutput "   - SETUP.md   : Guía detallada para colaboradores" "Gray"
Write-Host ""
Write-ColorOutput "🆘 Si tienes problemas:" "White"
Write-ColorOutput "   1. Verifica las versiones de Node.js (18+) y npm (8+)" "Gray"
Write-ColorOutput "   2. Asegúrate de estar en la rama feat/fullstack-bootstrap" "Gray"
Write-ColorOutput "   3. Ejecuta los comandos desde los directorios correctos" "Gray"
Write-ColorOutput "   4. Revisa que los puertos 3000 y 5173 estén disponibles" "Gray"
Write-Host ""
Write-ColorOutput "¡Happy Coding! 🚀🍺" "Cyan"