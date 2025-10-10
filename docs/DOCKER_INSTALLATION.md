# Guía de Instalación de Docker Desktop - Método Manual

## Opción 1: Instalación Manual (Recomendada)

### Paso 1: Descargar Docker Desktop

1. Ve a: https://www.docker.com/products/docker-desktop/
2. Haz clic en "Download for Windows"
3. Se descargará: "Docker Desktop Installer.exe"

### Paso 2: Instalar Docker Desktop

1. Ejecuta "Docker Desktop Installer.exe" como Administrador
   - Clic derecho → "Ejecutar como administrador"
2. Acepta los términos de licencia
3. Deja marcadas las opciones por defecto:
   - "Use WSL 2 instead of Hyper-V"
   - "Add shortcut to desktop"
4. Haz clic en "Install"
5. Espera a que termine la instalación
6. Haz clic en "Close and restart"

### Paso 3: Configuración Inicial

1. **REINICIA tu computadora** (muy importante)
2. Inicia Docker Desktop desde el menú de inicio
3. Acepta los términos de servicio
4. Opcionalmente crea una cuenta Docker (puedes omitir)
5. Completa el tutorial rápido (opcional)

### Paso 4: Verificar Instalación

Abre PowerShell y ejecuta:

```powershell
docker --version
docker-compose --version
```

Deberías ver algo como:

```
Docker version 24.0.x, build xxxxx
Docker Compose version v2.x.x
```

## Opción 2: Usando Winget (Windows 11)

Si tienes Windows 11, puedes usar winget:

```powershell
winget install Docker.DockerDesktop
```

## Opción 3: Usando Chocolatey

Si tienes Chocolatey instalado:

```powershell
choco install docker-desktop
```

## Después de la Instalación

### Verificar que Docker está funcionando:

```powershell
cd "C:\Users\juan0\OneDrive\Escritorio\Universidad Semestre 7\Gestión de proyectos TI\Plataforma web\cerveceria-usc"
docker --version
npm run docker:up
```

### Si todo funciona correctamente verás:

```
Creating cerveceria-postgres ... done
Creating cerveceria-n8n      ... done
```

### URLs disponibles después de `npm run docker:up`:

- PostgreSQL: localhost:5432
- n8n: http://localhost:5678 (usuario: admin, contraseña: admin123!)
- Adminer: http://localhost:8080

## Solución de Problemas Comunes

### Error: "WSL 2 installation is incomplete"

```powershell
# Ejecutar como administrador:
wsl --install
# Luego reiniciar
```

### Error: "Hardware assisted virtualization"

1. Entrar al BIOS/UEFI
2. Habilitar "Virtualization Technology" o "VT-x"
3. Reiniciar

### Docker Desktop no inicia

1. Verificar que Hyper-V esté habilitado (Windows Pro)
2. O que WSL 2 esté instalado (Windows Home)
3. Reiniciar el servicio Docker

### Verificar estado de Docker

```powershell
# Ver contenedores corriendo
docker ps

# Ver logs de los servicios
npm run docker:logs

# Parar todos los servicios
npm run docker:down
```

## Pasos Siguientes Después de Instalar Docker

1. **Instalar Docker** siguiendo esta guía
2. **Reiniciar** tu computadora
3. **Abrir PowerShell** en el directorio del proyecto
4. **Ejecutar**: `npm run docker:up`
5. **Verificar** que los servicios estén corriendo: `docker ps`
6. **Acceder a n8n**: http://localhost:5678
