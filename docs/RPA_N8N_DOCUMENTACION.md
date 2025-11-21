# 🤖 Automatización RPA con n8n - Cervecería USC

## 📋 Tabla de Contenidos
- [Introducción](#introducción)
- [Arquitectura de Integración](#arquitectura-de-integración)
- [Workflows Implementados](#workflows-implementados)
- [Configuración y Despliegue](#configuración-y-despliegue)
- [Guía de Uso](#guía-de-uso)
- [Beneficios Empresariales](#beneficios-empresariales)

---

## 🎯 Introducción

Este documento describe la implementación de **automatización RPA (Robotic Process Automation)** utilizando **n8n** para optimizar los procesos de gestión de inventario y reabastecimiento de la Cervecería USC.

### ¿Qué es n8n?

**n8n** es una plataforma de automatización de workflows de código abierto que permite conectar aplicaciones y automatizar tareas sin necesidad de programación compleja. Funciona mediante nodos visuales que representan acciones y lógica de negocio.

### ¿Por qué n8n para Cervecería USC?

- ✅ **Open Source**: Sin costos de licenciamiento
- ✅ **Self-Hosted**: Control total sobre los datos
- ✅ **Integración nativa**: Conecta con PostgreSQL, Email, Slack, Google Sheets, etc.
- ✅ **Workflows visuales**: Fácil de entender y mantener
- ✅ **Escalable**: Maneja desde tareas simples hasta complejas

---

## 🏗️ Arquitectura de Integración

```
┌─────────────────────────────────────────────────────────┐
│                    n8n (Puerto 5678)                     │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐│
│  │  Workflow 1   │  │  Workflow 2   │  │ Workflow 3  ││
│  │  Alertas      │  │  Solicitudes  │  │  Reportes   ││
│  └───────┬───────┘  └───────┬───────┘  └──────┬──────┘│
└──────────┼──────────────────┼─────────────────┼────────┘
           │                  │                  │
           │  HTTP Webhooks   │                  │
           └──────────────────┴──────────────────┘
                              │
           ┌──────────────────▼──────────────────┐
           │   Backend API (Puerto 3001)         │
           │   /api/webhooks/*                   │
           │  ┌──────────────────────────────┐   │
           │  │ webhooks.ts                  │   │
           │  │ - /stock-alerts              │   │
           │  │ - /crear-solicitud           │   │
           │  │ - /reporte-diario            │   │
           │  └────────────┬─────────────────┘   │
           └───────────────┼─────────────────────┘
                           │
           ┌───────────────▼───────────────┐
           │  PostgreSQL (Puerto 5433)     │
           │  Base de Datos cerveceria_usc │
           │  - productos                  │
           │  - movimientos_inventario     │
           │  - solicitudes_compra         │
           │  - politicas_abastecimiento   │
           └───────────────────────────────┘
```

### Flujo de Datos

1. **n8n** ejecuta workflows según horarios programados (cron)
2. Los workflows llaman a endpoints **webhooks** del backend
3. El **backend** consulta la base de datos y aplica lógica de negocio
4. n8n recibe los datos y ejecuta acciones:
   - Envío de emails
   - Notificaciones Slack/Teams
   - Registro en Google Sheets
   - Creación de documentos PDF

---

## 🔄 Workflows Implementados

### 1️⃣ Alertas de Stock Crítico

**Archivo**: `01-alertas-stock-critico.json`

**Objetivo**: Detectar productos con stock bajo y notificar automáticamente.

**Trigger**: Cada 6 horas (0 */6 * * *)

**Flujo**:

```
┌──────────────────┐
│ Trigger: Cada 6h │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────┐
│ POST /webhooks/stock-alerts│  ← Consulta productos bajo ROP
└────────┬───────────────────┘
         │
         ▼
┌───────────────────┐
│ ¿Hay Alertas?     │
└────┬──────────┬───┘
     │ SI       │ NO
     ▼          ▼
┌─────────┐  ┌─────┐
│Preparar │  │ Log │
│ Datos   │  └─────┘
└────┬────┘
     │
     ├──────────────┬───────────────┐
     ▼              ▼               ▼
┌─────────┐  ┌──────────┐  ┌──────────────┐
│ Email   │  │ Slack/   │  │Google Sheets │
│ HTML    │  │ Teams    │  │  Historial   │
└─────────┘  └──────────┘  └──────────────┘
```

**Prioridades de Alerta**:
- 🔴 **ALTA**: Stock agotado o < 30% del mínimo
- 🟡 **MEDIA**: Stock entre 30% y 70% del mínimo
- 🔵 **BAJA**: Stock entre 70% y 100% del mínimo

**Destinatarios**:
- admin@cerveceria-usc.edu.co
- gerente@cerveceria-usc.edu.co

**Contenido del Email**:
- Resumen de alertas por prioridad
- Listado de productos críticos
- Stock actual vs stock mínimo
- Cantidad sugerida de reabastecimiento
- Estimación de días hasta agotamiento

---

### 2️⃣ Creación Automática de Solicitudes

**Archivo**: `02-creacion-automatica-solicitudes.json`

**Objetivo**: Crear solicitudes de compra automáticamente para productos de prioridad alta.

**Trigger**: Cada 12 horas (0 */12 * * *)

**Flujo**:

```
┌──────────────────┐
│ Trigger: Cada12h │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────┐
│ POST /webhooks/stock-alerts│  ← Obtener productos críticos
└────────┬───────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ ¿Hay Prioridad ALTA?        │
└────┬────────────────────┬───┘
     │ SI                 │ NO
     ▼                    ▼
┌──────────────┐      ┌──────┐
│ Separar por  │      │ Log  │
│  Producto    │      └──────┘
└──────┬───────┘
       │  (Loop cada producto)
       ▼
┌──────────────────┐
│ Preparar Datos   │
│ - productoId     │
│ - cantidad       │
│ - prioridad=ALTA │
│ - observaciones  │
└──────┬───────────┘
       │
       ▼
┌─────────────────────────────┐
│ POST /webhooks/crear-solicitud│
└──────┬──────────────────────┘
       │
       ▼
┌───────────────────┐
│ ¿Creada OK?       │
└────┬──────────┬───┘
     │ SI       │ NO
     ▼          ▼
┌─────────┐  ┌──────┐
│Registrar│  │Log   │
│& Email  │  │Error │
└─────────┘  └──────┘
```

**Estrategia de Cantidad**:
- Usa la cantidad sugerida por el sistema (EOQ o Manual)
- Se calcula basado en la política de abastecimiento del producto

**Estado Inicial**:
- `EN_APROBACION` (entra al flujo de aprobaciones)

**Observaciones Automáticas**:
```
Solicitud automática generada por RPA
Producto: [Nombre] (SKU: [xxx])
Stock crítico: [n] unidades (Mínimo: [m])
Estrategia: EOQ / MANUAL
```

**Notificación**:
- Email a: compras@cerveceria-usc.edu.co
- Incluye enlace directo a la solicitud

---

### 3️⃣ Reporte Diario de Reabastecimiento

**Archivo**: `03-reporte-diario-reabastecimiento.json`

**Objetivo**: Generar reporte ejecutivo completo cada mañana.

**Trigger**: Diario a las 9:00 AM (0 9 * * *)

**Flujo**:

```
┌──────────────────┐
│ Trigger: 9:00 AM │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────┐
│ POST /webhooks/reporte-diario│
└────────┬───────────────────┘
         │
         ▼
┌─────────────────┐
│ ¿Reporte OK?    │
└────┬────────┬───┘
     │ SI     │ NO
     ▼        ▼
┌─────────┐ ┌─────┐
│Extraer  │ │Log  │
│ Datos   │ │Error│
└────┬────┘ └─────┘
     │
     ├────────────────┬────────────────┐
     ▼                ▼                ▼
┌──────────┐  ┌──────────────┐  ┌──────────┐
│Email HTML│  │Google Sheets │  │PDF Drive │
│Ejecutivo │  │ Histórico    │  │ Mensual  │
└──────────┘  └──────────────┘  └──────────┘
```

**Contenido del Reporte**:

1. **Resumen Ejecutivo**:
   - Total de productos
   - Productos que requieren reabastecimiento
   - Porcentaje de productos con alerta
   - Valor total estimado de compras

2. **Distribución por Prioridad**:
   - Cantidad de productos ALTA
   - Cantidad de productos MEDIA
   - Cantidad de productos BAJA

3. **Tabla Detallada de Prioridad ALTA**:
   - Nombre y SKU del producto
   - Stock actual vs stock mínimo
   - Cantidad sugerida
   - Costo estimado
   - Estrategia aplicada

4. **Visualizaciones**:
   - Gráficos de distribución
   - Tendencia histórica (si aplica)

**Destinatarios**:
- gerencia@cerveceria-usc.edu.co
- compras@cerveceria-usc.edu.co

**Archivos Generados**:
- Email HTML profesional
- Registro en Google Sheets (histórico)
- PDF en Google Drive (archivo mensual)

---

## ⚙️ Configuración y Despliegue

### Paso 1: Levantar n8n con Docker

n8n está configurado en `docker-compose.yml`:

```bash
# Desde el directorio /infra
docker-compose up -d n8n
```

**Acceso**:
- URL: http://localhost:5678
- Usuario: `admin` (configurable en .env)
- Contraseña: `n8n_password` (configurable en .env)

### Paso 2: Configurar Credenciales en n8n

Una vez dentro de n8n, configura las siguientes credenciales:

#### 📧 SMTP (Email)
```
Settings → Credentials → Add Credential → SMTP

Host: smtp.gmail.com (o tu servidor)
Port: 587
User: sistema@cerveceria-usc.edu.co
Password: [app password]
Secure: Use TLS
```

#### 💬 Slack (Opcional)
```
Settings → Credentials → Add Credential → Slack API

OAuth2:
1. Crear app en api.slack.com
2. Agregar bot token scopes: chat:write, channels:read
3. Copiar Bot User OAuth Token
```

#### 📊 Google Sheets
```
Settings → Credentials → Add Credential → Google Sheets OAuth2

1. Ir a console.cloud.google.com
2. Crear proyecto o usar existente
3. Habilitar Google Sheets API
4. Crear credenciales OAuth 2.0
5. Descargar JSON y pegar en n8n
```

### Paso 3: Importar Workflows

1. En n8n, ve a **Workflows** → **Add workflow** → **Import from file**
2. Importa los 3 archivos JSON:
   - `01-alertas-stock-critico.json`
   - `02-creacion-automatica-solicitudes.json`
   - `03-reporte-diario-reabastecimiento.json`

3. Para cada workflow:
   - Abre el workflow
   - Configura las credenciales en los nodos que las requieran
   - Click en **Active** para activarlo

### Paso 4: Verificar Endpoints Backend

Asegúrate de que el backend esté corriendo:

```bash
# En /packages/backend
npm run dev
```

Verifica los endpoints:
- http://localhost:3001/api/webhooks/health (debe retornar status: ok)
- http://localhost:3001/documentation (Swagger docs)

### Paso 5: Probar los Workflows

#### Test Manual:
1. En n8n, abre un workflow
2. Click en **Execute Workflow** (botón play arriba a la derecha)
3. Observa la ejecución nodo por nodo
4. Revisa los datos que fluyen entre nodos

#### Test con Datos Reales:
1. Crea productos en el sistema con stock bajo
2. Espera a que el trigger se ejecute o fuerza ejecución manual
3. Verifica que se envíen los emails y se creen las solicitudes

---

## 📖 Guía de Uso

### Para Administradores del Sistema

#### Monitorear Ejecuciones

1. Ir a n8n → **Executions**
2. Ver historial de todas las ejecuciones
3. Filtrar por workflow, estado (success/error), fecha
4. Click en una ejecución para ver detalles paso a paso

#### Modificar Horarios

```javascript
// En el nodo "Schedule Trigger"
Cron Expression: "0 */6 * * *"

Ejemplos:
- Cada hora: "0 * * * *"
- Cada 30 min: "*/30 * * * *"
- Lunes a Viernes 8 AM: "0 8 * * 1-5"
- Primer día del mes: "0 9 1 * *"
```

#### Personalizar Emails

1. Abre el workflow en n8n
2. Ve al nodo "Enviar Email"
3. Edita el campo "Email Body (HTML)"
4. Usa sintaxis Handlebars: `{{$json.variable}}`
5. Guarda y prueba

### Para Usuarios de Negocio

#### Recibir Alertas

Los emails automáticos incluyen:
- **Asunto claro**: "🚨 ALERTA: X productos con stock bajo"
- **Resumen visual**: Tarjetas con números clave
- **Tabla detallada**: Productos críticos con SKU, stock, etc.
- **Botón de acción**: Enlace directo al sistema

#### Revisar Solicitudes Automáticas

1. Ir al módulo de Solicitudes en el sistema
2. Filtrar por "EN_APROBACION"
3. Buscar observaciones que contengan "Solicitud automática generada por RPA"
4. Aprobar o rechazar según criterio de negocio

#### Consultar Reportes Históricos

- **Email**: Revisar bandeja de entrada (gerencia@cerveceria-usc.edu.co)
- **Google Sheets**: Ver evolución histórica día a día
- **Google Drive**: PDFs mensuales organizados por fecha

---

## 💰 Beneficios Empresariales

### Ahorro de Tiempo

| Tarea Manual | Tiempo Manual | Con RPA | Ahorro |
|-------------|---------------|---------|--------|
| Revisar stock diariamente | 30 min | 0 min | 100% |
| Crear solicitudes urgentes | 15 min/solicitud | 0 min | 100% |
| Generar reporte semanal | 2 horas | 0 min | 100% |
| Enviar notificaciones | 10 min | 0 min | 100% |
| **TOTAL SEMANAL** | **~15 horas** | **0 horas** | **15 h/semana** |

### Reducción de Errores

- ❌ **Sin RPA**: Olvidos, inconsistencias, datos desactualizados
- ✅ **Con RPA**: Proceso estandarizado, datos en tiempo real, registro completo

### Mejora en la Toma de Decisiones

- 📊 **Datos siempre actualizados**: Reportes diarios automáticos
- ⚡ **Respuesta rápida**: Alertas inmediatas de stock crítico
- 📈 **Histórico completo**: Tendencias y patrones identificables

### Escalabilidad

- ➕ **Agregar nuevos workflows**: Sin necesidad de más personal
- 🔧 **Modificar lógica**: Cambios visuales sin programar
- 🌐 **Integrar más sistemas**: Email, Slack, Teams, Drive, ERP, etc.

### ROI (Return on Investment)

```
Costo n8n Self-Hosted: $0/mes (open source)
Costo servidor: ~$20/mes (incluido en infraestructura existente)
Ahorro en tiempo: 15 horas/semana × $15/hora = $225/semana = $900/mes

ROI mensual: $900 - $20 = $880/mes
ROI anual: $10,560/año
```

---

## 🎓 Para Presentación al Profesor

### Puntos Clave a Destacar

1. **Integración Real**: Los workflows no son mock-ups, están conectados al backend real con PostgreSQL

2. **Arquitectura Profesional**: 
   - Separación de responsabilidades (n8n para orquestación, backend para lógica)
   - Webhooks RESTful con documentación Swagger
   - Manejo de errores y logs

3. **Casos de Uso Reales**:
   - Alertas automáticas de stock
   - Creación de solicitudes sin intervención humana
   - Reportes ejecutivos diarios

4. **Tecnologías Modernas**:
   - n8n (líder en workflow automation)
   - Docker (containerización)
   - PostgreSQL (base de datos robusta)
   - Email HTML profesional

5. **Escalabilidad**:
   - Fácil agregar nuevos workflows
   - Integración con cualquier API REST
   - Sin límites de complejidad

### Demo Sugerida

1. **Mostrar n8n UI**: Interfaz visual de los workflows
2. **Ejecutar workflow manualmente**: Ver flujo en tiempo real
3. **Mostrar email generado**: Diseño profesional
4. **Revisar backend**: Endpoints y lógica de negocio
5. **Consultar base de datos**: Solicitudes creadas automáticamente

### Preguntas Anticipadas

**P: ¿Por qué n8n y no Python scripts?**  
R: n8n ofrece interfaz visual, manejo nativo de errores, retry automático, logs completos, y no requiere conocimientos de programación para modificar workflows.

**P: ¿Es seguro?**  
R: Sí, está self-hosted (control total), usa Basic Auth, se comunica con el backend vía localhost, y las credenciales están encriptadas.

**P: ¿Qué pasa si falla?**  
R: n8n tiene retry automático, logs de errores, notificaciones de fallos, y el sistema continúa funcionando manualmente.

**P: ¿Es difícil de mantener?**  
R: No, los workflows son visuales y autodocumentados. Cualquier persona con conocimientos básicos puede modificarlos.

---

## 📚 Recursos Adicionales

- **Documentación n8n**: https://docs.n8n.io
- **Community Forum**: https://community.n8n.io
- **Cron Expression Generator**: https://crontab.guru
- **Swagger Docs Backend**: http://localhost:3001/documentation

---

## 🎯 Conclusión

La implementación de RPA con n8n en Cervecería USC demuestra cómo la automatización puede transformar procesos operativos, reducir errores humanos, ahorrar tiempo y mejorar la toma de decisiones basada en datos. Esta solución es escalable, mantenible y puede adaptarse a nuevas necesidades del negocio sin requerir desarrollo adicional complejo.

**Autor**: Sistema de Gestión de Cadena de Suministro - Cervecería USC  
**Fecha**: Noviembre 2025  
**Versión**: 1.0.0
