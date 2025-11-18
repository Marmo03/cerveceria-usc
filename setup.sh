#!/bin/bash

# 🍺 Cervecería USC - Script de Setup Automático
# Este script configura el entorno completo para nuevos colaboradores

set -e  # Salir si algún comando falla

echo "🍺 ======================================"
echo "   Cervecería USC - Setup Automático"
echo "======================================="
echo ""

# Verificar requisitos previos
echo "📋 Verificando requisitos previos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ desde https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versión $NODE_VERSION detectada. Se requiere versión 18 o superior."
    exit 1
fi

echo "✅ Node.js $(node --version) detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado."
    exit 1
fi

echo "✅ npm $(npm --version) detectado"

# Verificar Git
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado."
    exit 1
fi

echo "✅ Git $(git --version | cut -d' ' -f3) detectado"
echo ""

# Cambiar a la rama correcta
echo "🌿 Configurando rama de desarrollo..."
git checkout feat/fullstack-bootstrap 2>/dev/null || {
    echo "❌ Error: No se pudo cambiar a la rama feat/fullstack-bootstrap"
    echo "   Asegúrate de estar en el repositorio correcto y que la rama exista"
    exit 1
}

git pull origin feat/fullstack-bootstrap 2>/dev/null || {
    echo "⚠️  Advertencia: No se pudo hacer pull. Continuando con la versión local..."
}

echo "✅ Rama feat/fullstack-bootstrap configurada"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
echo "   Esto puede tomar varios minutos..."

npm install || {
    echo "❌ Error instalando dependencias del monorepo"
    exit 1
}

echo "✅ Dependencias del monorepo instaladas"

# Instalar dependencias específicas del backend
echo ""
echo "🔧 Configurando backend..."
cd packages/backend

npm install || {
    echo "❌ Error instalando dependencias del backend"
    exit 1
}

echo "✅ Dependencias del backend instaladas"

# Configurar base de datos
echo "🗄️  Configurando base de datos SQLite..."

# Generar cliente Prisma
npx prisma generate || {
    echo "❌ Error generando cliente Prisma"
    exit 1
}

# Ejecutar migraciones
npx prisma migrate dev --name init || {
    echo "❌ Error ejecutando migraciones de base de datos"
    exit 1
}

echo "✅ Migraciones de base de datos ejecutadas"

# Poblar base de datos con datos de prueba
echo "🌱 Poblando base de datos con datos de prueba..."
npm run db:seed || {
    echo "❌ Error poblando base de datos"
    exit 1
}

echo "✅ Base de datos poblada con datos de prueba"

# Regresar al directorio raíz
cd ../..

# Instalar dependencias del frontend
echo ""
echo "🎨 Configurando frontend..."
cd packages/frontend

npm install || {
    echo "❌ Error instalando dependencias del frontend"
    exit 1
}

echo "✅ Dependencias del frontend instaladas"

# Regresar al directorio raíz
cd ../..

echo ""
echo "🎉 ======================================"
echo "   ¡Setup completado exitosamente!"
echo "======================================="
echo ""
echo "🚀 Para ejecutar la aplicación:"
echo ""
echo "   Terminal 1 (Backend API):"
echo "   cd packages/backend"
echo "   npm run dev"
echo ""
echo "   Terminal 2 (Frontend UI):"
echo "   cd packages/frontend"  
echo "   npm run dev"
echo ""
echo "🌐 URLs una vez ejecutado:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo ""
echo "🔑 Usuarios de prueba (password: 123456):"
echo "   admin@cerveceria-usc.edu.co      (Administrador)"
echo "   operario@cerveceria-usc.edu.co   (Operario)"
echo "   aprobador@cerveceria-usc.edu.co  (Aprobador)"
echo "   analista@cerveceria-usc.edu.co   (Analista)"
echo ""
echo "📚 Recursos adicionales:"
echo "   - README.md  : Documentación completa"
echo "   - SETUP.md   : Guía detallada para colaboradores"
echo ""
echo "🆘 Si tienes problemas:"
echo "   1. Verifica las versiones de Node.js (18+) y npm (8+)"
echo "   2. Asegúrate de estar en la rama feat/fullstack-bootstrap"
echo "   3. Ejecuta los comandos desde los directorios correctos"
echo "   4. Revisa que los puertos 3000 y 5173 estén disponibles"
echo ""
echo "¡Happy Coding! 🚀🍺"