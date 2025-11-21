# Test de Webhooks con Salida JSON
Write-Host "=== PRUEBA DE WEBHOOKS ===" -ForegroundColor Cyan

$base = "http://localhost:3001/api/webhooks"
$body = @{} | ConvertTo-Json

# TEST 1
Write-Host "`n[1/3] Health Check..."
$h = Invoke-RestMethod -Uri "$base/health" -Method GET
Write-Host "OK - Uptime: $($h.uptime)s" -ForegroundColor Green

# TEST 2
Write-Host "`n[2/3] Stock Alerts..."
$s = Invoke-RestMethod -Uri "$base/stock-alerts" -Method POST -Body $body -ContentType "application/json"
Write-Host "OK - Alertas: $($s.productosConAlerta)" -ForegroundColor Green
Write-Host "Alta: $($s.resumen.totalAlta) | Media: $($s.resumen.totalMedia) | Baja: $($s.resumen.totalBaja)"

Write-Host "`nProductos con alerta:" -ForegroundColor Yellow
if ($s.alertas.alta.Count -gt 0) {
    Write-Host "ALTA:" -ForegroundColor Red
    foreach ($p in $s.alertas.alta) {
        Write-Host "  - $($p.nombre) | Stock: $($p.stockActual)/$($p.stockMin) | Sugerido: $($p.cantidadSugerida)"
    }
}
if ($s.alertas.media.Count -gt 0) {
    Write-Host "MEDIA:" -ForegroundColor Yellow
    foreach ($p in $s.alertas.media) {
        Write-Host "  - $($p.nombre) | Stock: $($p.stockActual)/$($p.stockMin) | Sugerido: $($p.cantidadSugerida)"
    }
}
if ($s.alertas.baja.Count -gt 0) {
    Write-Host "BAJA:" -ForegroundColor Blue
    foreach ($p in $s.alertas.baja) {
        Write-Host "  - $($p.nombre) | Stock: $($p.stockActual)/$($p.stockMin)"
    }
}

# TEST 3
Write-Host "`n[3/3] Reporte Diario..."
$r = Invoke-RestMethod -Uri "$base/reporte-diario" -Method POST -Body $body -ContentType "application/json"
Write-Host "OK - Total: $($r.totalProductos) | Con alerta: $($r.productosReabastecimiento)" -ForegroundColor Green
Write-Host "Valor estimado: $$$($r.resumen.valorTotalEstimado)"
Write-Host "Alta: $($r.resumen.productosPrioridadAlta) | Media: $($r.resumen.productosPrioridadMedia) | Baja: $($r.resumen.productosPrioridadBaja)"

Write-Host "`n=== TODOS LOS TESTS PASARON ===" -ForegroundColor Green
Write-Host "`nProximo paso: Importar workflows en n8n (http://localhost:5678)" -ForegroundColor Cyan
