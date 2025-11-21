# Módulo de Rastreo de Pedidos

## 📦 Descripción

Este módulo permite a la empresa **rastrear y monitorear los pedidos que llegan** desde proveedores usando el sistema de Servientrega. 

**Importante:** Este módulo está diseñado únicamente para **recibir pedidos**, no para enviar. La empresa no realiza envíos salientes, solo rastrea los productos que vienen hacia ella.

## 🎯 Funcionalidades

### 1. Rastreo de Pedidos (Tab Principal)
- **Búsqueda por número de guía** de Servientrega
- **Consulta en tiempo real** del estado del envío
- **Historial completo** de movimientos con línea de tiempo visual
- **Información detallada**: origen, destino, fechas, remitente, peso, etc.
- **Mensajes directos** de Servientrega sobre el estado del pedido

### 2. Estadísticas de Recepción
- **Dashboard completo** con métricas de recepción
- **Tarjetas resumen**: Total de pedidos, recibidos, en camino, pendientes
- **Distribución por estado** con gráficos de barras
- **Pedidos recientes** con acceso rápido al detalle
- **Métricas calculadas**:
  - Tiempo promedio de entrega
  - Tasa de recepción exitosa

## 🔧 Estructura Técnica

### Frontend

```
packages/frontend/src/
├── pages/
│   └── LogisticaPage.vue          # Página principal con 2 tabs
├── components/
│   └── logistics/
│       ├── TrackingTab.vue         # Tab de rastreo de pedidos
│       └── EstadisticasTab.vue     # Tab de estadísticas de recepción
└── services/
    └── servientregaTracking.ts     # Servicio para consultar API de Servientrega
```

### Backend

```
packages/backend/src/
└── controllers/
    └── logistics.ts                # Incluye proxy genérico para Servientrega API
```

## 🌐 Integración con Servientrega

### Endpoint Principal

El módulo usa el **proxy genérico** del backend para evitar problemas de CORS:

```
GET /api/logistics/servientrega-proxy/*
```

### Endpoints de Servientrega Utilizados

1. **Rastreo de envío**:
   ```
   GET /Rastreo/RastreoEnvio/{numeroGuia}
   ```
   - Retorna: Estado actual, historial, origen, destino, fechas

2. **Endpoints alternativos** (según versión de API):
   ```
   GET /Rastreo/Seguimiento/{numeroGuia}
   GET /Tracking/ConsultarGuia/{numeroGuia}
   ```

### Formato de Respuesta

El servicio `servientregaTracking.ts` transforma automáticamente la respuesta de Servientrega a un formato estándar:

```typescript
interface TrackingResponse {
  numeroGuia: string
  estado: string              // "EN TRÁNSITO", "ENTREGADO", etc.
  origen?: string
  destino?: string
  fechaEstimada?: string
  mensaje?: string            // Mensaje directo de Servientrega
  historial?: TrackingEvent[] // Array de movimientos
  detalles?: {
    remitente?: string
    destinatario?: string
    peso?: string
    unidades?: string
  }
}
```

## 🚀 Uso

### Rastrear un Pedido

1. Ir a **Logística → Rastrear Pedido**
2. Ingresar el **número de guía** de Servientrega (8-15 caracteres)
3. Presionar **Enter** o hacer clic en **→**
4. El sistema mostrará:
   - Estado actual con badge de color
   - Origen y destino
   - Fecha estimada de entrega
   - Mensaje de Servientrega
   - Historial completo con línea de tiempo

### Ver Estadísticas

1. Ir a **Logística → Estadísticas de Recepción**
2. Visualizar:
   - Tarjetas con métricas principales
   - Gráficos de distribución por estado
   - Lista de pedidos recientes
   - Tiempo promedio de entrega
   - Tasa de recepción exitosa

## 🎨 Estados de Pedidos

| Estado | Color | Descripción |
|--------|-------|-------------|
| `PENDIENTE` | Amarillo | Pedido confirmado, aún no enviado |
| `EN_PREPARACION` | Azul claro | Proveedor preparando el pedido |
| `EN_TRANSITO` | Azul oscuro | Pedido en camino |
| `EN_ADUANA` | Naranja | Retenido en aduana (internacional) |
| `EN_ENTREGA` | Índigo | En última milla de entrega |
| `ENTREGADO` | Verde | Recibido exitosamente |
| `CANCELADO` | Rojo | Pedido cancelado |
| `DEVUELTO` | Naranja oscuro | Pedido devuelto |

## 🔐 Validaciones

### Formato de Número de Guía

El sistema valida automáticamente:
- ✅ Longitud entre 8 y 15 caracteres
- ✅ Solo números, letras mayúsculas y guiones
- ✅ No vacío o con espacios

```typescript
// Ejemplo de uso
import { validarNumeroGuia } from '@/services/servientregaTracking'

validarNumeroGuia('123456789')     // ✅ true
validarNumeroGuia('ABC-123-XYZ')   // ✅ true
validarNumeroGuia('12345')         // ❌ false (muy corto)
validarNumeroGuia('abc123')        // ❌ false (minúsculas no permitidas)
```

## 🐛 Manejo de Errores

El sistema maneja diferentes tipos de errores:

### Errores de Usuario
- Número de guía no ingresado
- Formato de guía inválido
- Guía no encontrada en Servientrega

### Errores de Servicio
- Error 404: Guía no existe
- Error 500: Problema en servidor de Servientrega
- Error de red: Sin conexión

Todos los errores se muestran con mensajes claros y amigables.

## 📊 Componentes Eliminados

Los siguientes componentes fueron **removidos** ya que la empresa no envía productos:

- ❌ `EnviosTab.vue` - Gestión de envíos salientes
- ❌ `CotizarEnvioTab.vue` - Cotización de envíos
- ❌ `TransportistasTab.vue` - Gestión de transportistas
- ❌ Modal de crear envío
- ❌ Modal de crear transportista

## 🔄 Flujo de Datos

```
Usuario ingresa guía
        ↓
Validación en frontend
        ↓
servientregaTracking.rastrearEnvio()
        ↓
Backend proxy: /api/logistics/servientrega-proxy/Rastreo/RastreoEnvio/{guia}
        ↓
API de Servientrega
        ↓
Transformación de respuesta
        ↓
Renderizado en TrackingTab con estado, historial y detalles
```

## 🧪 Testing

### Probar el Rastreo

Puedes probar con números de guía reales de Servientrega. Si no tienes uno, el sistema te informará que la guía no existe.

### Verificar Proxy

```bash
# Verificar que el proxy backend está funcionando
curl http://localhost:3001/api/logistics/servientrega-proxy/Rastreo/RastreoEnvio/123456789
```

## 📝 Notas Importantes

1. **Solo Recepción**: Este módulo NO maneja envíos salientes
2. **API de Servientrega**: Requiere que el backend esté corriendo para el proxy
3. **Actualización en tiempo real**: Cada consulta hace una llamada directa a Servientrega
4. **Historial local**: Los pedidos rastreados se pueden almacenar en la base de datos para análisis

## 🔮 Mejoras Futuras

- [ ] Notificaciones cuando un pedido cambia de estado
- [ ] Integración con sistema de inventario al recibir pedidos
- [ ] Webhook de Servientrega para actualizaciones automáticas
- [ ] Exportar reportes de recepción en PDF/Excel
- [ ] Dashboard con gráficos avanzados (Chart.js)
- [ ] Alertas cuando un pedido se demora más de lo esperado

## 🆘 Solución de Problemas

### "Error al conectar con Servientrega"
- Verificar que el backend esté corriendo
- Verificar conexión a internet
- Revisar logs del backend

### "Número de guía no encontrado"
- Verificar que el número sea correcto
- Asegurarse de que sea una guía de Servientrega
- Puede que el envío aún no esté en el sistema (muy reciente)

### El historial no aparece
- Algunos envíos muy recientes pueden no tener historial aún
- Verificar respuesta de la API en DevTools → Network

## 📞 Soporte

Para problemas con:
- **Números de guía**: Contactar al proveedor
- **API de Servientrega**: Verificar documentación oficial
- **Errores del sistema**: Revisar logs del backend y consola del navegador
