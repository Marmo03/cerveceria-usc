# Ejemplos de Archivos CSV para Importación

Este directorio contiene ejemplos de archivos CSV para las diferentes funcionalidades de importación del sistema.

## Tipos de Importación Soportados

### 1. Importación de Productos (`productos_valido.csv`)

**Columnas requeridas:**

- `sku`: Código único del producto (requerido)
- `nombre`: Nombre del producto (requerido)
- `categoria`: Categoría del producto (requerido)
- `unidad`: Unidad de medida (requerido)
- `costo`: Costo unitario (requerido, numérico)

**Columnas opcionales:**

- `stockInicial`: Stock inicial (numérico, default: 0)
- `stockMinimo`: Stock mínimo (numérico, default: 0)
- `leadTime`: Tiempo de entrega en días (numérico, default: 7)

### 2. Ajuste de Stock (`ajuste_stock_valido.csv`)

**Columnas requeridas:**

- `sku`: Código del producto existente (requerido)
- `stockActual`: Nuevo stock actual (requerido, numérico)

**Columnas opcionales:**

- `comentario`: Comentario del ajuste

### 3. Registro de Ventas (`ventas_valido.csv`)

**Columnas requeridas:**

- `sku`: Código del producto (requerido)
- `cantidad`: Cantidad vendida (requerido, numérico)

**Columnas opcionales:**

- `fecha`: Fecha de la venta (formato ISO 8601)
- `cliente`: Nombre del cliente
- `precio`: Precio de venta unitario

## Archivo con Errores de Ejemplo

El archivo `productos_errores.csv` contiene ejemplos de errores comunes:

1. **Fila 2**: SKU vacío (campo requerido)
2. **Fila 3**: Costo con valor no numérico ("abc")
3. **Fila 4**: Nombre vacío (campo requerido)
4. **Fila 5**: Costo negativo (valor inválido)
5. **Fila 6**: Stock inicial con texto en lugar de número

## Formato General

- **Separador**: Coma (`,`)
- **Codificación**: UTF-8
- **Primera fila**: Encabezados (se salta por defecto)
- **Campos de texto**: Sin comillas, excepto si contienen comas
- **Fechas**: Formato ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
- **Números**: Sin separadores de miles, punto decimal

## Uso en la API

### Endpoint de Importación

```
POST /api/importaciones
```

**Body (multipart/form-data):**

```json
{
  "tipo": "PRODUCTOS|STOCK|VENTAS",
  "archivo": [archivo CSV],
  "configuracion": {
    "separador": ",",
    "encoding": "utf-8",
    "saltarPrimeraFila": true
  }
}
```

### Respuesta de Importación

```json
{
  "success": true,
  "data": {
    "importacion": {
      "id": "imp-123",
      "estado": "COMPLETADA",
      "archivo": "productos.csv"
    },
    "resumen": {
      "totalFilas": 7,
      "filasExitosas": 6,
      "filasConError": 1,
      "tiempoEjecucion": 2.5
    },
    "errores": [
      {
        "fila": 3,
        "columna": "costo",
        "valor": "abc",
        "error": "Costo debe ser un número válido",
        "tipo": "FORMATO"
      }
    ]
  }
}
```

## Validaciones Aplicadas

### Productos

- SKU único (no duplicados)
- Campos requeridos no vacíos
- Valores numéricos válidos
- Longitud máxima de texto

### Stock

- Producto debe existir en el sistema
- Stock actual debe ser numérico y >= 0

### Ventas

- Producto debe existir
- Cantidad debe ser > 0
- Stock suficiente para la venta
- Formato de fecha válido (si se proporciona)

## Buenas Prácticas

1. **Validar antes de importar**: Usar archivos pequeños para probar el formato
2. **Respaldos**: Hacer backup antes de importaciones masivas
3. **Lotes pequeños**: Importar en lotes para facilitar corrección de errores
4. **Verificación posterior**: Revisar los datos importados y errores reportados
5. **Logs**: Conservar los logs de importación para auditoría
