# Script Simple de Prueba de Webhooks
Write-Host "`n=== PRUEBA DE WEBHOOKS RPA ===" -ForegroundColor Cyan

$base = "http://localhost:3001/api/webhooks"

# TEST 1: Health
Write-Host "`n[1/3] Health Check..." -ForegroundColor Yellow
try {
    $h = Invoke-RestMethod -Uri "$base/health" -Method GET
    Write-Host "✅ OK - Uptime: $($h.uptime)s" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# TEST 2: Stock Alerts
Write-Host "`n[2/3] Stock Alerts..." -ForegroundColor Yellow
try {
    $body = @{} | ConvertTo-Json
    $s = Invoke-RestMethod -Uri "$base/stock-alerts" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ OK - Alertas: $($s.productosConAlerta)" -ForegroundColor Green
    Write-Host "   Alta: $($s.resumen.totalAlta), Media: $($s.resumen.totalMedia), Baja: $($s.resumen.totalBaja)" -ForegroundColor White
} catch {
    Write-Host "❌ FAIL: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# TEST 3: Reporte Diario
Write-Host "`n[3/3] Reporte Diario..." -ForegroundColor Yellow
try {
    $body = @{} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$base/reporte-diario" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ OK - Total Productos: $($r.totalProductos)" -ForegroundColor Green
    Write-Host "   Valor Estimado: $$$($r.resumen.valorTotalEstimado)" -ForegroundColor White
} catch {
    Write-Host "❌ FAIL: $_" -ForegroundColor Red
}

Write-Host "`n=== FIN DE PRUEBAS ===`n" -ForegroundColor Cyan
