# 🤖 Workflow n8n: Automatización de Solicitudes por Stock Bajo

## 📋 Descripción General

Este workflow automatiza la creación de solicitudes de compra cuando el stock de un producto cae por debajo del mínimo establecido.

**URL de n8n**: http://localhost:5678  
**Usuario**: admin  
**Contraseña**: n8n_password

---

## 🔄 Flujo del Proceso RPA

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  1. Usuario registra SALIDA de inventario en la aplicación web     │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  2. Backend detecta: stockNuevo <= stockMin                         │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  3. Backend dispara webhook a n8n con datos del producto           │
│     POST http://localhost:5678/webhook/stock-bajo                  │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        🤖 n8n WORKFLOW                              │
│                                                                     │
│  4. Webhook recibe datos                                            │
│     ↓                                                               │
│  5. Valida prioridad del stock                                      │
│     ↓                                                               │
│  6. Envía notificación por email (OPCIONAL)                         │
│     ↓                                                               │
│  7. Crea solicitud de compra automática                             │
│     POST http://localhost:3001/api/webhooks/crear-solicitud        │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  8. Backend crea la solicitud en estado EN_APROBACION              │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  9. Usuario ve la solicitud automática en el dashboard             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Configuración del Workflow en n8n

### Paso 1: Acceder a n8n

1. Abrir navegador en: http://localhost:5678
2. Iniciar sesión con:
   - **Usuario**: `admin`
   - **Contraseña**: `n8n_password`

### Paso 2: Crear Nuevo Workflow

1. Click en **"New workflow"** (botón "+" arriba a la derecha)
2. Dar nombre al workflow: **"Automatización Stock Bajo"**

### Paso 3: Configurar Nodos

#### 📥 NODO 1: Webhook (Trigger)

**Tipo**: `Webhook`

**Configuración**:
- **HTTP Method**: `POST`
- **Path**: `stock-bajo`
- **Authentication**: None (o Basic Auth si prefieres seguridad)
- **Response Mode**: `When Last Node Finishes`
- **Response Code**: `200`

**URL resultante**: `http://localhost:5678/webhook/stock-bajo`

Este nodo recibirá el siguiente payload del backend:

```json
{
  "evento": "STOCK_BAJO_DETECTADO",
  "timestamp": "2025-11-20T14:00:00.000Z",
  "producto": {
    "id": "uuid-producto",
    "sku": "SKU-001",
    "nombre": "Malta Pilsen",
    "stockActual": 5,
    "stockMinimo": 20
  },
  "movimiento": {
    "id": "uuid-movimiento",
    "tipo": "SALIDA",
    "cantidad": 15,
    "stockAnterior": 20,
    "stockNuevo": 5
  },
  "sugerencia": {
    "cantidad": 35,
    "prioridad": "ALTA",
    "costoEstimado": 175000
  },
  "callbackUrl": "http://localhost:3001/api/webhooks/crear-solicitud"
}
```

---

#### 🔀 NODO 2: Switch (Condicional por Prioridad)

**Tipo**: `Switch`

**Configuración**:
- **Mode**: `Rules`

**Reglas**:

**Ruta 1 - Prioridad ALTA**:
- **Condition**: `{{ $json.sugerencia.prioridad === "ALTA" }}`
- Acción: Enviar email urgente + Crear solicitud

**Ruta 2 - Prioridad MEDIA**:
- **Condition**: `{{ $json.sugerencia.prioridad === "MEDIA" }}`
- Acción: Crear solicitud sin email

**Ruta 3 - Prioridad BAJA**:
- **Condition**: `{{ $json.sugerencia.prioridad === "BAJA" }}`
- Acción: Solo crear solicitud

---

#### 📧 NODO 3A: Send Email (Solo para Prioridad ALTA)

**Tipo**: `Send Email` (Gmail)

**Configuración**:
- **From Email**: `juan0303manuel@gmail.com`
- **To Email**: `juan0303manuel@gmail.com, admin@cerveceria-usc.edu.co`
- **Subject**: `🚨 ALERTA URGENTE: Stock crítico - {{ $json.producto.nombre }}`

**Email Body (HTML)**:
```html
<h2 style="color: red;">⚠️ ALERTA DE STOCK CRÍTICO</h2>

<p><strong>Producto:</strong> {{ $json.producto.nombre }} (SKU: {{ $json.producto.sku }})</p>

<table style="border-collapse: collapse; width: 100%;">
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Stock Actual:</strong></td>
    <td style="border: 1px solid #ddd; padding: 8px; color: red;">{{ $json.producto.stockActual }} unidades</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Stock Mínimo:</strong></td>
    <td style="border: 1px solid #ddd; padding: 8px;">{{ $json.producto.stockMinimo }} unidades</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;"><strong>Prioridad:</strong></td>
    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: red;">{{ $json.sugerencia.prioridad }}</td>
  </tr>
</table>

<h3>📦 Solicitud Automática Generada</h3>
<p><strong>Cantidad sugerida:</strong> {{ $json.sugerencia.cantidad }} unidades</p>
<p><strong>Costo estimado:</strong> ${{ $json.sugerencia.costoEstimado.toLocaleString() }}</p>

<p><strong>Movimiento que disparó la alerta:</strong></p>
<ul>
  <li>Tipo: {{ $json.movimiento.tipo }}</li>
  <li>Cantidad: {{ $json.movimiento.cantidad }}</li>
  <li>Stock anterior: {{ $json.movimiento.stockAnterior }}</li>
  <li>Stock nuevo: {{ $json.movimiento.stockNuevo }}</li>
</ul>

<p style="color: #666; font-size: 12px;">
  Fecha: {{ $json.timestamp }}<br>
  Sistema RPA - Cervecería USC
</p>
```

**Credentials**:
- Usa las credenciales Gmail ya configuradas en el backend:
  - **Email**: `juan0303manuel@gmail.com`
  - **App Password**: `xnqetrqakxmvypyc`

---

#### 📝 NODO 3B: Set Variables (Preparar datos para solicitud)

**Tipo**: `Set`

**Configuración**:
```javascript
{
  "productoId": "{{ $json.producto.id }}",
  "cantidad": "{{ $json.sugerencia.cantidad }}",
  "prioridad": "{{ $json.sugerencia.prioridad }}",
  "observaciones": "Solicitud automática generada por RPA el {{ $json.timestamp }}. Stock crítico detectado: {{ $json.producto.stockActual }}/{{ $json.producto.stockMinimo }} unidades."
}
```

---

#### 🌐 NODO 4: HTTP Request (Crear Solicitud en Backend)

**Tipo**: `HTTP Request`

**Configuración**:
- **Method**: `POST`
- **URL**: `http://host.docker.internal:3001/api/webhooks/crear-solicitud`
  - ⚠️ Nota: Usar `host.docker.internal` para que el contenedor de n8n acceda al backend en el host
- **Authentication**: None
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```

**Body (JSON)**:
```json
{
  "productoId": "={{ $json.productoId }}",
  "cantidad": "={{ $json.cantidad }}",
  "prioridad": "={{ $json.prioridad }}",
  "observaciones": "={{ $json.observaciones }}"
}
```

**Response**:
```json
{
  "success": true,
  "solicitudId": "uuid-solicitud",
  "producto": "Malta Pilsen",
  "cantidad": 35,
  "estado": "EN_APROBACION",
  "mensaje": "Solicitud de compra creada automáticamente"
}
```

---

#### ✅ NODO 5: Return Response (Responder al Backend)

**Tipo**: `Respond to Webhook`

**Configuración**:
- **Response Body**:
```json
{
  "success": true,
  "mensaje": "Workflow ejecutado exitosamente",
  "solicitudCreada": "={{ $json.solicitudId }}",
  "timestamp": "={{ $now }}"
}
```

---

## 📊 Diagrama del Workflow en n8n

```
┌────────────────┐
│   Webhook      │ ← Recibe POST del backend
│  /stock-bajo   │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│    Switch      │ ← Evalúa prioridad
│  (Prioridad)   │
└────┬───┬───┬───┘
     │   │   │
ALTA │   │   │ BAJA
     ▼   ▼   ▼ MEDIA
┌─────────────────┐
│  Send Email     │ (Solo ALTA)
│  Gmail SMTP     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Set Variables  │ ← Prepara payload
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTTP Request   │ ← POST /crear-solicitud
│  (Backend API)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Respond Webhook │ ← Responde al backend
└─────────────────┘
```

---

## 🧪 Prueba del Workflow

### Opción 1: Desde la Aplicación Web

1. Ir a **Inventario** en la aplicación
2. Seleccionar un producto con stock cerca del mínimo
3. Registrar una **SALIDA** que deje el stock por debajo del mínimo
4. El workflow debería dispararse automáticamente

### Opción 2: Prueba Manual con PowerShell

```powershell
$payload = @{
    evento = "STOCK_BAJO_DETECTADO"
    timestamp = (Get-Date -Format o)
    producto = @{
        id = "test-producto-id"
        sku = "SKU-TEST"
        nombre = "Producto de Prueba"
        stockActual = 5
        stockMinimo = 20
    }
    movimiento = @{
        id = "test-movimiento-id"
        tipo = "SALIDA"
        cantidad = 15
        stockAnterior = 20
        stockNuevo = 5
    }
    sugerencia = @{
        cantidad = 35
        prioridad = "ALTA"
        costoEstimado = 175000
    }
    callbackUrl = "http://localhost:3001/api/webhooks/crear-solicitud"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:5678/webhook/stock-bajo" `
                  -Method POST `
                  -ContentType "application/json" `
                  -Body $payload
```

---

## 📈 Métricas y Monitoreo

En n8n puedes ver:
- **Executions**: Historial de ejecuciones del workflow
- **Success Rate**: Tasa de éxito
- **Average Runtime**: Tiempo promedio de ejecución
- **Error Logs**: Logs de errores para debugging

Para acceder:
1. Click en el workflow
2. Tab **"Executions"** (abajo)
3. Ver detalles de cada ejecución

---

## 🔧 Configuración Adicional (Opcional)

### Agregar Autenticación al Webhook

1. En el nodo Webhook, habilitar **Basic Auth**
2. Configurar usuario/contraseña
3. Actualizar en backend el archivo `.env`:
   ```env
   N8N_WEBHOOK_AUTH_USER=admin
   N8N_WEBHOOK_AUTH_PASSWORD=secret123
   ```

### Agregar Notificaciones a Slack/Teams

1. Agregar nodo **Slack** o **Microsoft Teams** después del Switch
2. Configurar credenciales del workspace
3. Enviar mensaje con detalles del stock bajo

### Programar Chequeos Periódicos

1. Cambiar trigger de **Webhook** a **Schedule Trigger**
2. Configurar ejecución cada hora
3. Agregar nodo HTTP Request para obtener productos en stock bajo:
   ```
   GET http://localhost:3001/api/webhooks/stock-alerts
   ```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"

**Problema**: n8n no puede acceder a `localhost:3001` desde el contenedor

**Solución**: Usar `host.docker.internal:3001` en lugar de `localhost:3001`

### Error: "Webhook no responde"

**Problema**: El workflow no se está ejecutando

**Solución**:
1. Verificar que el workflow esté **activado** (toggle en la esquina superior derecha)
2. Verificar que el nodo Webhook esté en modo **Production**
3. Revisar logs del backend: `docker logs cerveceria-n8n`

### Error: "Email no se envía"

**Problema**: Credenciales de Gmail inválidas

**Solución**:
1. Verificar que la contraseña de aplicación sea correcta
2. Habilitar "Aplicaciones menos seguras" en Gmail
3. Revisar logs del nodo Send Email en n8n

---

## 📝 Notas para la Presentación

### Puntos Clave a Destacar:

1. **Automatización Real**: 
   - No es código hardcodeado, es un workflow visual en n8n
   - Puede modificarse sin tocar código

2. **Integración Bidireccional**:
   - Backend → n8n (dispara webhook)
   - n8n → Backend (crea solicitud)

3. **Flexibilidad**:
   - Fácil agregar más pasos (notificaciones, aprobaciones, etc.)
   - Puede integrarse con otros sistemas (ERP, CRM, etc.)

4. **Monitoreo**:
   - Historial completo de ejecuciones
   - Logs de errores y debugging visual

5. **Escalabilidad**:
   - Puede manejar múltiples productos simultáneamente
   - Puede agregar más workflows para otros procesos

### Demostración Sugerida:

1. **Mostrar la aplicación web** funcionando
2. **Abrir n8n** en otra pestaña y mostrar el workflow visual
3. **Registrar un movimiento** que deje stock bajo
4. **Mostrar en tiempo real** la ejecución en n8n
5. **Verificar** que la solicitud se creó en la aplicación

---

## 🎯 Resultado Final

Cuando el workflow esté configurado y activo:

✅ Stock bajo detectado automáticamente  
✅ Email enviado en casos críticos  
✅ Solicitud de compra creada sin intervención manual  
✅ Proceso 100% automatizado con RPA  
✅ Visualización y monitoreo en tiempo real  

---

**Documento creado el**: 20 de noviembre de 2025  
**Versión**: 1.0  
**Proyecto**: Cervecería USC - Plataforma RPA
