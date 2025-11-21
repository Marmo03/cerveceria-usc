# 🎯 GUÍA RÁPIDA: Importar Workflows en n8n

## ✅ Estado Actual
- ✅ Backend funcionando en http://localhost:3001
- ✅ n8n funcionando en http://localhost:5678  
- ✅ Webhooks probados y funcionando
- ✅ 3 workflows listos para importar

## 📦 Workflows Disponibles

Los workflows están en: `infra/n8n/workflows/`

1. **01-alertas-stock-critico.json**
   - Ejecuta cada 6 horas
   - Envía alertas cuando hay stock crítico
   - Acciones: Email, Slack, Google Sheets

2. **02-creacion-automatica-solicitudes.json**
   - Ejecuta cada 12 horas
   - Crea solicitudes automáticas para productos críticos
   - Acciones: Crear solicitud + Email de confirmación

3. **03-reporte-diario-reabastecimiento.json**
   - Ejecuta diariamente a las 9 AM
   - Genera reporte completo de reabastecimiento
   - Acciones: Email ejecutivo, Google Sheets, PDF en Drive

## 🚀 Pasos para Importar

### 1. Acceder a n8n
```
Abre: http://localhost:5678
Usuario: admin
Password: n8n_password
```

### 2. Importar Workflow 1 (Alertas)

1. En n8n, haz clic en el botón **"+"** (nuevo workflow) en la esquina superior derecha
2. Haz clic en los **3 puntos** (...) en la esquina superior derecha
3. Selecciona **"Import from File"**
4. Navega a: `infra/n8n/workflows/01-alertas-stock-critico.json`
5. Haz clic en **"Import"**
6. El workflow aparecerá con todos los nodos

### 3. Configurar el Backend URL

En el nodo **"HTTP Request"**:
1. Haz clic en el nodo
2. Verifica que la URL sea: `http://host.docker.internal:3001/api/webhooks/stock-alerts`
3. Method: POST
4. Body: JSON vacío `{}`

### 4. Ejecutar Manualmente (Prueba)

1. En la esquina superior derecha, haz clic en **"Execute Workflow"**
2. Verás los datos fluir por los nodos
3. El nodo "IF" evaluará si hay alertas
4. Si hay alertas, se ejecutarán las acciones (Email, etc.)

**NOTA**: Para la primera prueba, puedes deshabilitar los nodos de Email/Slack haciendo clic derecho → "Disable". Así puedes ver el flujo sin configurar credenciales.

### 5. Repetir para Workflows 2 y 3

Sigue los mismos pasos para:
- `02-creacion-automatica-solicitudes.json`
- `03-reporte-diario-reabastecimiento.json`

## 🔧 Configuración Opcional (Para Producción)

Si quieres que los workflows envíen emails reales:

### Configurar SMTP (Gmail)

1. En n8n, ve a **Settings** → **Credentials**
2. Haz clic en **"Add Credential"**
3. Busca y selecciona **"SMTP"**
4. Completa:
   ```
   From Email: tu-email@gmail.com
   Host: smtp.gmail.com
   Port: 587
   User: tu-email@gmail.com
   Password: (contraseña de aplicación de Gmail)
   Security: TLS
   ```
5. Guarda

### Configurar Slack (Opcional)

1. En Slack, crea un webhook: https://api.slack.com/messaging/webhooks
2. En n8n, configura el nodo Slack con la URL del webhook

### Configurar Google Sheets (Opcional)

1. En Google Cloud Console, crea un proyecto
2. Habilita la API de Google Sheets
3. Crea credenciales OAuth 2.0
4. En n8n, conecta con Google Sheets usando OAuth

## 📊 Verificar que Todo Funciona

### Test 1: Ejecutar Workflow Manualmente

1. Abre el workflow de alertas
2. Haz clic en "Execute Workflow"
3. Verifica que:
   - El nodo HTTP Request se ejecuta y retorna datos
   - Los datos incluyen: `success: true`, `productosConAlerta`, `alertas`
   - El flujo continúa según la condición IF

### Test 2: Ver Datos en el Nodo

1. Haz clic en el nodo **"HTTP Request"** después de ejecutar
2. En el panel derecho verás los datos en formato JSON:
   ```json
   {
     "success": true,
     "totalProductos": 18,
     "productosConAlerta": 2,
     "alertas": {
       "alta": [],
       "media": [...],
       "baja": [...]
     }
   }
   ```

### Test 3: Activar el Schedule

1. En la parte superior del workflow, verás un toggle **"Active"/"Inactive"**
2. Cambia a **"Active"**
3. El workflow se ejecutará automáticamente según el schedule configurado
4. Para ver las ejecuciones, ve a **"Executions"** en el menú lateral

## 🎓 Para la Presentación al Profesor

### Demostración Recomendada (10 minutos)

1. **Mostrar Backend** (2 min)
   - Abre: http://localhost:3001/documentation
   - Muestra los endpoints de webhooks
   - Ejecuta un test desde Swagger: `GET /webhooks/health`

2. **Mostrar n8n** (5 min)
   - Abre: http://localhost:5678
   - Muestra los 3 workflows importados
   - Ejecuta manualmente el workflow de alertas
   - Muestra cómo los datos fluyen por los nodos
   - Explica el schedule (cada 6 horas, 12 horas, diario)

3. **Mostrar Resultados** (3 min)
   - Muestra el panel de ejecuciones (Executions)
   - Explica las acciones automatizadas (Email, Slack, Sheets)
   - Muestra la documentación en `docs/RPA_N8N_DOCUMENTACION.md`

### Puntos Clave para Destacar

✅ **Solución Open Source**: n8n es gratuito y self-hosted (no costo por ejecución)
✅ **Integración Nativa**: 400+ integraciones sin código
✅ **Ahorro de Tiempo**: 15 horas/semana automatizadas ($880/mes)
✅ **Escalable**: Fácil agregar más workflows
✅ **Visual**: Flujos fáciles de entender para no técnicos
✅ **Producción Ready**: Docker, logs, monitoreo incluido

## 📝 Checklist Final

Antes de la presentación:

- [ ] Backend corriendo (`npm run dev` en packages/backend)
- [ ] n8n corriendo (`docker-compose up -d n8n`)
- [ ] 3 workflows importados en n8n
- [ ] Al menos 1 workflow ejecutado manualmente con éxito
- [ ] Documentación `RPA_N8N_DOCUMENTACION.md` revisada
- [ ] `GUIA_PRESENTACION_RPA.md` leída
- [ ] URLs accesibles:
  - http://localhost:3001 (Backend)
  - http://localhost:3001/documentation (Swagger)
  - http://localhost:5678 (n8n)
  - http://localhost:5174 (Frontend - opcional)

## 🆘 Troubleshooting

### Problema: "Cannot connect to backend"
- Verifica que el backend esté corriendo
- En el workflow, usa `http://host.docker.internal:3001` (no `localhost`)

### Problema: "Workflow no se ejecuta automáticamente"
- Verifica que el toggle "Active" esté en verde
- Revisa el schedule en el nodo "Schedule Trigger"
- Espera el tiempo del schedule o ejecuta manualmente

### Problema: "Nodos de Email fallan"
- Para la demo, deshabilita los nodos de Email/Slack
- O configura credenciales SMTP válidas

### Problema: "Error al importar workflow"
- Asegúrate de importar el archivo `.json` correcto
- Verifica que n8n esté actualizado (latest)

## 🎉 ¡Listo para Presentar!

Tienes todo configurado para una excelente presentación de RPA.
Los workflows están funcionando y puedes demostrar automatización real.

**¡Éxito en la presentación!** 🚀
