# Script para instalar Docker Desktop en Windows
# Ejecutar como Administrador

Write-Host "Instalando Docker Desktop..." -ForegroundColor Green

# Verificar si ya está instalado
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Docker ya está instalado:" -ForegroundColor Yellow
    docker --version
    exit 0
}

# Crear directorio temporal
$tempDir = "$env:TEMP\DockerInstall"
New-Item -ItemType Directory -Force -Path $tempDir

# URL de descarga de Docker Desktop
$dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$installerPath = "$tempDir\Docker Desktop Installer.exe"

Write-Host "Descargando Docker Desktop..." -ForegroundColor Blue
try {
    Invoke-WebRequest -Uri $dockerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "Descarga completada" -ForegroundColor Green
} catch {
    Write-Host "Error descargando Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Instalando Docker Desktop..." -ForegroundColor Blue
try {
    Start-Process -FilePath $installerPath -ArgumentList "install", "--quiet" -Wait -NoNewWindow
    Write-Host "Instalación completada" -ForegroundColor Green
} catch {
    Write-Host "Error instalando Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Limpiar archivos temporales
Remove-Item -Recurse -Force $tempDir

Write-Host @"
Docker Desktop instalado exitosamente!

IMPORTANTE:
1. Reinicia tu computadora
2. Inicia Docker Desktop desde el menú de inicio
3. Acepta los términos de servicio
4. Espera a que Docker esté listo (ícono en la bandeja del sistema)
5. Luego ejecuta: npm run docker:up

Para verificar la instalación después del reinicio:
docker --version
docker-compose --version
"@ -ForegroundColor Cyan