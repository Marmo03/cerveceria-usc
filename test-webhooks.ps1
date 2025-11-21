# Script de Prueba de Webhooks RPA - Cervecería USC
# Este script prueba los 3 endpoints de n8n

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA DE WEBHOOKS RPA - n8n" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001/api/webhooks"
$testResults = @()

# ==============================================================================
# TEST 1: Health Check
# ==============================================================================
Write-Host "📊 TEST 1: Health Check" -ForegroundColor Yellow
Write-Host "Endpoint: GET $baseUrl/health`n" -ForegroundColor Gray

try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health Check: OK" -ForegroundColor Green
    Write-Host "Status: $($health.status)" -ForegroundColor White
    Write-Host "Uptime: $([math]::Round($health.uptime, 2)) segundos`n" -ForegroundColor White
    $testResults += @{ Test = "Health Check"; Status = "✅ PASS" }
}
catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "Error: $_`n" -ForegroundColor Red
    $testResults += @{ Test = "Health Check"; Status = "❌ FAIL" }
}

Start-Sleep -Seconds 1

# ==============================================================================
# TEST 2: Stock Alerts
# ==============================================================================
Write-Host "`n📦 TEST 2: Stock Alerts (Productos con Stock Bajo)" -ForegroundColor Yellow
Write-Host "Endpoint: POST $baseUrl/stock-alerts`n" -ForegroundColor Gray

try {
    $alerts = Invoke-RestMethod -Uri "$baseUrl/stock-alerts" -Method POST -ContentType "application/json" -TimeoutSec 30
    
    if ($alerts.success) {
        Write-Host "✅ Stock Alerts: OK" -ForegroundColor Green
        Write-Host "`n📊 RESUMEN:" -ForegroundColor Cyan
        Write-Host "  • Total Productos: $($alerts.totalProductos)" -ForegroundColor White
        Write-Host "  • Productos con Alerta: $($alerts.productosConAlerta)" -ForegroundColor White
        Write-Host "`n🚨 ALERTAS POR PRIORIDAD:" -ForegroundColor Cyan
        Write-Host "  🔴 Alta:   $($alerts.resumen.totalAlta)" -ForegroundColor Red
        Write-Host "  🟡 Media:  $($alerts.resumen.totalMedia)" -ForegroundColor Yellow
        Write-Host "  🔵 Baja:   $($alerts.resumen.totalBaja)`n" -ForegroundColor Blue
        
        if ($alerts.alertas.alta.Count -gt 0) {
            Write-Host "🔴 PRODUCTOS DE PRIORIDAD ALTA:" -ForegroundColor Red
            foreach ($producto in $alerts.alertas.alta) {
                Write-Host "  • $($producto.nombre) (SKU: $($producto.sku))" -ForegroundColor White
                Write-Host "    Stock: $($producto.stockActual) / Mínimo: $($producto.stockMin)" -ForegroundColor Gray
                Write-Host "    Cantidad Sugerida: $($producto.cantidadSugerida) unidades`n" -ForegroundColor Gray
            }
        }
        
        $testResults += @{ Test = "Stock Alerts"; Status = "✅ PASS" }
    }
    else {
        Write-Host "⚠️  Warning: Response success = false" -ForegroundColor Yellow
        $testResults += @{ Test = "Stock Alerts"; Status = "⚠️  WARNING" }
    }
}
catch {
    Write-Host "❌ Stock Alerts: FAILED" -ForegroundColor Red
    Write-Host "Error: $_`n" -ForegroundColor Red
    $testResults += @{ Test = "Stock Alerts"; Status = "❌ FAIL" }
}

Start-Sleep -Seconds 1

# ==============================================================================
# TEST 3: Reporte Diario
# ==============================================================================
Write-Host "`n📈 TEST 3: Reporte Diario de Reabastecimiento" -ForegroundColor Yellow
Write-Host "Endpoint: POST $baseUrl/reporte-diario`n" -ForegroundColor Gray

try {
    $reporte = Invoke-RestMethod -Uri "$baseUrl/reporte-diario" -Method POST -ContentType "application/json" -TimeoutSec 30
    
    if ($reporte.success) {
        Write-Host "✅ Reporte Diario: OK" -ForegroundColor Green
        Write-Host "`n📊 ESTADÍSTICAS:" -ForegroundColor Cyan
        Write-Host "  • Total Productos: $($reporte.totalProductos)" -ForegroundColor White
        Write-Host "  • Requieren Reabastecimiento: $($reporte.productosReabastecimiento)" -ForegroundColor White
        Write-Host "  • % con Alerta: $($reporte.resumen.porcentajeProductosConAlerta)%" -ForegroundColor White
        Write-Host "`n💰 VALOR ESTIMADO:" -ForegroundColor Cyan
        $valorFormateado = "{0:N0}" -f $reporte.resumen.valorTotalEstimado
        Write-Host "  • Total a Invertir: $$$valorFormateado`n" -ForegroundColor White
        
        Write-Host "📋 DISTRIBUCIÓN:" -ForegroundColor Cyan
        Write-Host "  🔴 Alta:   $($reporte.resumen.productosPrioridadAlta) productos" -ForegroundColor Red
        Write-Host "  🟡 Media:  $($reporte.resumen.productosPrioridadMedia) productos" -ForegroundColor Yellow
        Write-Host "  🔵 Baja:   $($reporte.resumen.productosPrioridadBaja) productos`n" -ForegroundColor Blue
        
        $testResults += @{ Test = "Reporte Diario"; Status = "✅ PASS" }
    }
    else {
        Write-Host "⚠️  Warning: Response success = false" -ForegroundColor Yellow
        $testResults += @{ Test = "Reporte Diario"; Status = "⚠️  WARNING" }
    }
}
catch {
    Write-Host "❌ Reporte Diario: FAILED" -ForegroundColor Red
    Write-Host "Error: $_`n" -ForegroundColor Red
    $testResults += @{ Test = "Reporte Diario"; Status = "❌ FAIL" }
}

# ==============================================================================
# RESUMEN FINAL
# ==============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DE PRUEBAS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($result in $testResults) {
    Write-Host "$($result.Status)  $($result.Test)" -ForegroundColor White
}

$passed = ($testResults | Where-Object { $_.Status -like "*PASS*" }).Count
$total = $testResults.Count

Write-Host "`n✅ Pruebas Exitosas: $passed / $total" -ForegroundColor Green

if ($passed -eq $total) {
    Write-Host "`n🎉 ¡TODOS LOS TESTS PASARON!" -ForegroundColor Green
    Write-Host "Los webhooks están listos para n8n.`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Algunos tests fallaron. Revisa los logs del backend.`n" -ForegroundColor Yellow
}

Write-Host "========================================`n" -ForegroundColor Cyan
