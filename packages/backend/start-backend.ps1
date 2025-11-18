# Script para iniciar el backend
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Iniciando Backend Cervecería USC  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot
npm run dev

Write-Host ""
Write-Host "Backend detenido. Presiona cualquier tecla para cerrar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
