# Guía de Importación Masiva de Productos y Movimientos

Esta guía explica cómo usar la nueva funcionalidad de importación masiva de productos y movimientos de inventario desde archivos Excel o CSV.

## 📋 Tabla de Contenidos
- [Importar Productos](#importar-productos)
- [Importar Movimientos](#importar-movimientos)
- [Formatos de Archivo](#formatos-de-archivo)
- [Validaciones y Errores](#validaciones-y-errores)

---

## 🏭 Importar Productos

### Acceso
1. Navega a **Gestión de Productos**
2. Click en el botón **"Importar Productos"** (verde, con icono de descarga)
3. Solo disponible para usuarios con rol **ADMIN**

### Estructura del Archivo

El archivo debe contener las siguientes columnas:

| Columna | Tipo | Requerido | Descripción | Ejemplo |
|---------|------|-----------|-------------|---------|
| `sku` | Texto | ✅ Sí | Código único del producto | PROD001 |
| `nombre` | Texto | ✅ Sí | Nombre del producto | Cerveza Lager 330ml |
| `categoria` | Texto | ✅ Sí | Categoría del producto | Bebidas |
| `unidad` | Texto | ✅ Sí | Unidad de medida | UND, L, KG, etc. |
| `stockActual` | Número | ❌ No | Stock inicial | 100 |
| `stockMin` | Número | ❌ No | Stock mínimo | 20 |
| `costo` | Número | ✅ Sí | Costo unitario | 2500 |
| `leadTime` | Número | ❌ No | Tiempo de entrega (días) | 7 |

### Unidades Permitidas
- `L` - Litros
- `KG` - Kilogramos
- `UND` - Unidades
- `ML` - Mililitros
- `G` - Gramos
- `M` - Metros
- `CM` - Centímetros
- `CAJA` - Cajas
- `PAQUETE` - Paquetes

### Ejemplo de CSV

```csv
sku,nombre,categoria,unidad,stockActual,stockMin,costo,leadTime
PROD001,Cerveza Lager 330ml,Bebidas,UND,100,20,2500,7
PROD002,Malta Premium 500g,Materias Primas,KG,50,10,15000,15
PROD003,Botella Vidrio 330ml,Envases,UND,500,100,800,5
```

### Comportamiento
- Si el **SKU ya existe**, el producto se **actualiza** con los nuevos datos
- Si el **SKU no existe**, se **crea** un nuevo producto
- Los campos opcionales toman valor `0` si no se proporcionan

---

## 📦 Importar Movimientos

### Acceso
1. Navega a **Gestión de Inventario**
2. Click en el botón **"Importar Movimientos"** (verde, con icono de descarga)
3. Disponible para usuarios con rol **ADMIN** u **OPERARIO**

### Estructura del Archivo

| Columna | Tipo | Requerido | Descripción | Ejemplo |
|---------|------|-----------|-------------|---------|
| `sku` | Texto | ✅ Sí | Código del producto | PROD001 |
| `tipo` | Texto | ✅ Sí | ENTRADA o SALIDA | ENTRADA |
| `cantidad` | Número | ✅ Sí | Cantidad a mover | 50 |
| `comentario` | Texto | ❌ No | Motivo del movimiento | Compra proveedor |
| `referencia` | Texto | ❌ No | Referencia externa | PO-2024-001 |

### Tipos de Movimiento
- **ENTRADA**: Incrementa el stock (compras, devoluciones de clientes, ajustes positivos)
- **SALIDA**: Reduce el stock (ventas, devoluciones a proveedores, ajustes negativos)

### Ejemplo de CSV

```csv
sku,tipo,cantidad,comentario,referencia
PROD001,ENTRADA,50,Compra proveedor,PO-2024-001
PROD002,SALIDA,10,Producción lote 45,PROD-045
PROD003,ENTRADA,200,Reposición stock,PO-2024-002
```

### Validaciones
- ✅ El producto debe existir (busca por SKU)
- ✅ Para **SALIDAS**, verifica que haya stock suficiente
- ✅ La cantidad debe ser mayor a 0
- ✅ Se registra automáticamente el usuario que realiza la importación

### Comportamiento de Transacciones
- Todos los movimientos se procesan en **una sola transacción**
- Si **algún movimiento falla**, se hace **ROLLBACK** de todos
- Esto garantiza consistencia de datos

---

## 📄 Formatos de Archivo

### Formatos Soportados
- ✅ **CSV** (.csv)
- ✅ **Excel** (.xlsx, .xls)

### Consideraciones
- La **primera fila** debe contener los nombres de las columnas exactos
- Los nombres de columnas son **case-sensitive** (sku, no SKU)
- Usa **UTF-8** como encoding para caracteres especiales
- Tamaño máximo: **10 MB**

### Descargar Plantillas
1. Abre el modal de importación
2. Click en **"📥 Descargar plantilla de ejemplo"**
3. Se descargará un CSV con la estructura correcta y ejemplos

---

## ⚠️ Validaciones y Errores

### Resultado de la Importación

Después de importar, verás un resumen:

```
✅ Importación completada
✓ Registros procesados: 50
✓ Registros exitosos: 48
✗ Errores: 2
```

### Errores Comunes

#### Productos
| Error | Causa | Solución |
|-------|-------|----------|
| "Faltan campos requeridos" | Falta sku, nombre, categoria, unidad o costo | Completa todos los campos obligatorios |
| "El costo debe ser un número" | Valor no numérico en costo | Usa solo números (ej: 2500, no "$2,500") |
| "Unidad no válida" | Unidad no está en la lista permitida | Usa una de las unidades permitidas |

#### Movimientos
| Error | Causa | Solución |
|-------|-------|----------|
| "Producto con SKU XXX no encontrado" | El SKU no existe en la base de datos | Crea el producto primero o verifica el SKU |
| "Stock insuficiente. Stock actual: 10" | Intentas sacar más de lo que hay | Reduce la cantidad o verifica el stock |
| "El tipo debe ser ENTRADA o SALIDA" | Tipo incorrecto | Usa solo ENTRADA o SALIDA (mayúsculas) |
| "La cantidad debe ser un número mayor a 0" | Cantidad inválida | Usa números positivos enteros |

### Detalle de Errores

Si hay errores, verás hasta **50 líneas con error**:

```
Errores encontrados:
Línea 5: Faltan campos requeridos: sku, nombre, categoria
Línea 12: Producto con SKU PROD999 no encontrado
Línea 23: Stock insuficiente. Stock actual: 5
```

---

## 🎯 Mejores Prácticas

### Antes de Importar
1. ✅ **Descarga la plantilla** y úsala como base
2. ✅ **Valida los datos** en Excel antes de importar
3. ✅ **Prueba con pocos registros** primero (5-10 líneas)
4. ✅ **Haz backup** de datos importantes

### Durante la Importación
1. ✅ Revisa el **resumen de validación** antes de confirmar
2. ✅ Si hay errores, **corrígelos y vuelve a importar**
3. ✅ Para archivos grandes (>100 registros), **divide en lotes**

### Después de Importar
1. ✅ Verifica que los **productos aparezcan** correctamente
2. ✅ Revisa los **stocks actualizados** en inventario
3. ✅ Consulta el **historial de movimientos** para auditoría

---

## 🔐 Permisos

| Funcionalidad | ADMIN | OPERARIO | APROBADOR |
|---------------|-------|----------|-----------|
| Importar Productos | ✅ | ❌ | ❌ |
| Importar Movimientos | ✅ | ✅ | ❌ |

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la **consola del navegador** (F12) para errores detallados
2. Verifica que el **archivo cumpla con la estructura** requerida
3. Consulta la sección de **errores comunes** en esta guía
4. Contacta al administrador del sistema

---

## 📝 Ejemplo Completo

### Escenario: Carga Inicial de Inventario

**Paso 1: Importar Productos**

Archivo: `productos_inicial.csv`
```csv
sku,nombre,categoria,unidad,stockActual,stockMin,costo,leadTime
MAT001,Malta Pilsen 25kg,Materia Prima,KG,0,100,45000,15
MAT002,Lúpulo Cascade 500g,Materia Prima,KG,0,20,85000,30
ENV001,Botella Ámbar 355ml,Envase,UND,0,1000,650,7
ENV002,Tapón Corona,Envase,UND,0,5000,120,5
```

**Paso 2: Registrar Compras**

Archivo: `compras_inicial.csv`
```csv
sku,tipo,cantidad,comentario,referencia
MAT001,ENTRADA,500,Compra inicial inventario,PO-2024-001
MAT002,ENTRADA,150,Compra inicial inventario,PO-2024-001
ENV001,ENTRADA,5000,Compra inicial inventario,PO-2024-002
ENV002,ENTRADA,25000,Compra inicial inventario,PO-2024-002
```

**Resultado:**
- ✅ 4 productos creados con stock en 0
- ✅ 4 movimientos de entrada registrados
- ✅ Stock actualizado automáticamente
- ✅ Historial de movimientos auditable

---

¡Listo! Ahora puedes importar productos y movimientos de forma masiva, ahorrando tiempo en la carga de datos. 🚀
