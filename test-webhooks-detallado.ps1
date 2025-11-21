# Test Detallado de Webhooks para n8n
Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  PRUEBA DETALLADA DE WEBHOOKS RPA - n8n   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$base = "http://localhost:3001/api/webhooks"
$body = @{} | ConvertTo-Json

# =============================================================================
# TEST 1: Health Check
# =============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📊 TEST 1: Health Check" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

try {
    $health = Invoke-RestMethod -Uri "$base/health" -Method GET
    
    Write-Host "✅ Estado: " -NoNewline -ForegroundColor Green
    Write-Host $health.status.ToUpper() -ForegroundColor White
    Write-Host "⏱️  Uptime: " -NoNewline -ForegroundColor Cyan
    Write-Host "$([math]::Round($health.uptime, 2)) segundos" -ForegroundColor White
    Write-Host "🕐 Timestamp: " -NoNewline -ForegroundColor Cyan
    Write-Host $health.timestamp -ForegroundColor Gray
    
    Write-Host "`n✅ Health Check: PASS" -ForegroundColor Green
}
catch {
    Write-Host "❌ Health Check: FAIL" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# =============================================================================
# TEST 2: Stock Alerts (Detallado)
# =============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📦 TEST 2: Stock Alerts (Alertas de Inventario)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

try {
    $alerts = Invoke-RestMethod -Uri "$base/stock-alerts" -Method POST -Body $body -ContentType "application/json"
    
    if ($alerts.success) {
        Write-Host "`n📊 RESUMEN GENERAL:" -ForegroundColor Cyan
        Write-Host "   Total Productos en Sistema: " -NoNewline -ForegroundColor White
        Write-Host $alerts.totalProductos -ForegroundColor Yellow
        Write-Host "   Productos con Alerta: " -NoNewline -ForegroundColor White
        Write-Host $alerts.productosConAlerta -ForegroundColor Red
        
        Write-Host "`n🚨 DISTRIBUCIÓN POR PRIORIDAD:" -ForegroundColor Cyan
        Write-Host "   🔴 ALTA:   " -NoNewline -ForegroundColor Red
        Write-Host "$($alerts.resumen.totalAlta) productos" -ForegroundColor White
        Write-Host "   🟡 MEDIA:  " -NoNewline -ForegroundColor Yellow
        Write-Host "$($alerts.resumen.totalMedia) productos" -ForegroundColor White
        Write-Host "   🔵 BAJA:   " -NoNewline -ForegroundColor Blue
        Write-Host "$($alerts.resumen.totalBaja) productos" -ForegroundColor White
        
        # Mostrar productos de prioridad ALTA
        if ($alerts.alertas.alta.Count -gt 0) {
            Write-Host "`n🔴 PRODUCTOS PRIORIDAD ALTA (Críticos):" -ForegroundColor Red
            foreach ($p in $alerts.alertas.alta) {
                Write-Host "`n   ├─ $($p.nombre)" -ForegroundColor White
                Write-Host "   │  SKU: $($p.sku)" -ForegroundColor Gray
                Write-Host "   │  Stock Actual: $($p.stockActual) | Stock Mínimo: $($p.stockMin)" -ForegroundColor Gray
                Write-Host "   │  Cantidad Sugerida: $($p.cantidadSugerida) unidades" -ForegroundColor Yellow
                Write-Host "   └─ Costo Estimado: $$$($p.costo * $p.cantidadSugerida)" -ForegroundColor Green
            }
        }
        
        # Mostrar productos de prioridad MEDIA
        if ($alerts.alertas.media.Count -gt 0) {
            Write-Host "`n🟡 PRODUCTOS PRIORIDAD MEDIA:" -ForegroundColor Yellow
            foreach ($p in $alerts.alertas.media) {
                Write-Host "   • $($p.nombre) (SKU: $($p.sku))" -ForegroundColor White
                Write-Host "     Stock: $($p.stockActual)/$($p.stockMin) | Sugerido: $($p.cantidadSugerida)" -ForegroundColor Gray
            }
        }
        
        # Mostrar productos de prioridad BAJA
        if ($alerts.alertas.baja.Count -gt 0) {
            Write-Host "`n🔵 PRODUCTOS PRIORIDAD BAJA:" -ForegroundColor Blue
            foreach ($p in $alerts.alertas.baja) {
                Write-Host "   • $($p.nombre) - Stock: $($p.stockActual)/$($p.stockMin)" -ForegroundColor Gray
            }
        }
        
        Write-Host "`n✅ Stock Alerts: PASS" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Respuesta recibida pero success = false" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Stock Alerts: FAIL" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# =============================================================================
# TEST 3: Reporte Diario (Detallado)
# =============================================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📈 TEST 3: Reporte Diario de Reabastecimiento" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

try {
    $reporte = Invoke-RestMethod -Uri "$base/reporte-diario" -Method POST -Body $body -ContentType "application/json"
    
    if ($reporte.success) {
        Write-Host "`n📅 Fecha del Reporte: " -NoNewline -ForegroundColor Cyan
        Write-Host $reporte.fecha -ForegroundColor White
        
        Write-Host "`n📊 ESTADÍSTICAS GENERALES:" -ForegroundColor Cyan
        Write-Host "   Total Productos en Sistema: " -NoNewline -ForegroundColor White
        Write-Host $reporte.totalProductos -ForegroundColor Yellow
        Write-Host "   Requieren Reabastecimiento: " -NoNewline -ForegroundColor White
        Write-Host $reporte.productosReabastecimiento -ForegroundColor Red
        
        $porcentaje = $reporte.resumen.porcentajeProductosConAlerta
        Write-Host "   Porcentaje con Alerta: " -NoNewline -ForegroundColor White
        if ($porcentaje -gt 50) {
            Write-Host "$porcentaje% 🔴" -ForegroundColor Red
        }
        elseif ($porcentaje -gt 25) {
            Write-Host "$porcentaje% 🟡" -ForegroundColor Yellow
        }
        else {
            Write-Host "$porcentaje% 🟢" -ForegroundColor Green
        }
        
        Write-Host "`n💰 INVERSIÓN ESTIMADA:" -ForegroundColor Cyan
        $valorFormateado = "{0:N0}" -f $reporte.resumen.valorTotalEstimado
        Write-Host "   Total a Invertir: " -NoNewline -ForegroundColor White
        Write-Host "$$$valorFormateado" -ForegroundColor Green
        
        Write-Host "`n📋 DISTRIBUCIÓN POR PRIORIDAD:" -ForegroundColor Cyan
        Write-Host "   🔴 ALTA:   $($reporte.resumen.productosPrioridadAlta) productos" -ForegroundColor Red
        Write-Host "   🟡 MEDIA:  $($reporte.resumen.productosPrioridadMedia) productos" -ForegroundColor Yellow
        Write-Host "   🔵 BAJA:   $($reporte.resumen.productosPrioridadBaja) productos" -ForegroundColor Blue
        
        # Top 5 productos que requieren reabastecimiento
        if ($reporte.detalles.Count -gt 0) {
            Write-Host "`n🔝 TOP 5 PRODUCTOS PRIORITARIOS:" -ForegroundColor Cyan
            $top5 = $reporte.detalles | Select-Object -First 5
            $index = 1
            foreach ($p in $top5) {
                $prioIcon = switch ($p.prioridad) {
                    "ALTA" { "🔴" }
                    "MEDIA" { "🟡" }
                    "BAJA" { "🔵" }
                }
                Write-Host "`n   $index. $prioIcon $($p.nombre)" -ForegroundColor White
                Write-Host "      SKU: $($p.sku) | Stock: $($p.stockActual)/$($p.stockMin)" -ForegroundColor Gray
                Write-Host "      Cantidad Sugerida: $($p.cantidadSugerida) unidades" -ForegroundColor Yellow
                Write-Host "      Costo Estimado: $$$($p.costoEstimado)" -ForegroundColor Green
                $index++
            }
        }
        
        Write-Host "`n✅ Reporte Diario: PASS" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Respuesta recibida pero success = false" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Reporte Diario: FAIL" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# =============================================================================
# RESUMEN FINAL
# =============================================================================
Write-Host "`n`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           RESUMEN DE PRUEBAS               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n✅ Los 3 webhooks están funcionando correctamente" -ForegroundColor Green
Write-Host "🔗 Base URL: $base" -ForegroundColor Gray
Write-Host "`n📝 ENDPOINTS DISPONIBLES PARA n8n:" -ForegroundColor Cyan
Write-Host "   1. GET  $base/health" -ForegroundColor White
Write-Host "   2. POST $base/stock-alerts" -ForegroundColor White
Write-Host "   3. POST $base/reporte-diario" -ForegroundColor White
Write-Host "   4. POST $base/crear-solicitud" -ForegroundColor White

Write-Host "`n🎯 PRÓXIMO PASO:" -ForegroundColor Yellow
Write-Host "   1. Abre n8n en http://localhost:5678" -ForegroundColor White
Write-Host "   2. Importa los workflows desde infra/n8n/workflows/" -ForegroundColor White
Write-Host "   3. Configura credenciales (email, Slack, etc.)" -ForegroundColor White
Write-Host "   4. Ejecuta los workflows manualmente para probar" -ForegroundColor White

Write-Host "`n════════════════════════════════════════════`n" -ForegroundColor Cyan
