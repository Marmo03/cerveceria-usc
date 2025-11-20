import { FastifyRequest, FastifyReply } from 'fastify';
import * as XLSX from 'xlsx';
import pool from '../db.js';

interface ProductoImport {
  sku: string;
  nombre: string;
  categoria: string;
  unidad: string;
  stockActual?: number;
  stockMin?: number;
  costo: number;
  leadTime?: number;
}

interface MovimientoImport {
  sku: string;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  comentario?: string;
  referencia?: string;
}

interface ErrorDetalle {
  linea: number;
  error: string;
}

/**
 * Importar productos desde archivo Excel o CSV
 */
export const importarProductos = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No se ha enviado ningún archivo' });
    }

    // Leer el archivo
    const buffer = await data.toBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return reply.status(400).send({ error: 'El archivo está vacío' });
    }

    let exitosos = 0;
    let errores = 0;
    const detalleErrores: ErrorDetalle[] = [];

    // Procesar cada fila
    for (let i = 0; i < jsonData.length; i++) {
      const fila = jsonData[i];
      const linea = i + 2; // +2 porque Excel empieza en 1 y tiene header

      try {
        // Validar campos requeridos
        if (!fila.sku || !fila.nombre || !fila.categoria || !fila.unidad || fila.costo === undefined) {
          throw new Error('Faltan campos requeridos: sku, nombre, categoria, unidad, costo');
        }

        // Normalizar datos
        const producto: ProductoImport = {
          sku: String(fila.sku).trim().toUpperCase(),
          nombre: String(fila.nombre).trim(),
          categoria: String(fila.categoria).trim(),
          unidad: String(fila.unidad).trim().toUpperCase(),
          stockActual: fila.stockActual ? Number(fila.stockActual) : 0,
          stockMin: fila.stockMin ? Number(fila.stockMin) : 0,
          costo: Number(fila.costo),
          leadTime: fila.leadTime ? Number(fila.leadTime) : 0,
        };

        // Validar tipos de datos
        if (isNaN(producto.costo)) {
          throw new Error('El costo debe ser un número');
        }
        if (producto.stockActual !== undefined && isNaN(producto.stockActual)) {
          throw new Error('El stock actual debe ser un número');
        }
        if (producto.stockMin !== undefined && isNaN(producto.stockMin)) {
          throw new Error('El stock mínimo debe ser un número');
        }
        if (producto.leadTime !== undefined && isNaN(producto.leadTime)) {
          throw new Error('El lead time debe ser un número');
        }

        // Validar unidades permitidas
        const unidadesPermitidas = ['L', 'KG', 'UND', 'ML', 'G', 'M', 'CM', 'CAJA', 'PAQUETE'];
        if (!unidadesPermitidas.includes(producto.unidad)) {
          throw new Error(`Unidad no válida. Debe ser una de: ${unidadesPermitidas.join(', ')}`);
        }

        // Verificar si el producto ya existe
        const existeResult = await pool.query(
          'SELECT id FROM productos WHERE sku = $1',
          [producto.sku]
        );

        if (existeResult.rows.length > 0) {
          // Actualizar producto existente
          await pool.query(
            `UPDATE productos 
             SET nombre = $1, categoria = $2, unidad = $3, "stockActual" = $4, 
                 "stockMin" = $5, costo = $6, "leadTime" = $7, "updatedAt" = NOW()
             WHERE sku = $8`,
            [
              producto.nombre,
              producto.categoria,
              producto.unidad,
              producto.stockActual,
              producto.stockMin,
              producto.costo,
              producto.leadTime,
              producto.sku,
            ]
          );
        } else {
          // Insertar nuevo producto
          await pool.query(
            `INSERT INTO productos (id, sku, nombre, categoria, unidad, "stockActual", "stockMin", costo, "leadTime", "isActive", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())`,
            [
              producto.sku,
              producto.nombre,
              producto.categoria,
              producto.unidad,
              producto.stockActual,
              producto.stockMin,
              producto.costo,
              producto.leadTime,
            ]
          );
        }

        exitosos++;
      } catch (error: any) {
        errores++;
        detalleErrores.push({
          linea,
          error: error.message || 'Error desconocido',
        });
      }
    }

    return reply.send({
      procesados: jsonData.length,
      exitosos,
      errores,
      detalleErrores: detalleErrores.slice(0, 50), // Limitar a 50 errores para no saturar
    });
  } catch (error: any) {
    console.error('Error al importar productos:', error);
    return reply.status(500).send({ error: error.message || 'Error al procesar el archivo' });
  }
};

/**
 * Importar movimientos de inventario desde archivo Excel o CSV
 */
export const importarMovimientos = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Obtener usuario autenticado
    const usuario = (request as any).user;
    if (!usuario || !usuario.id) {
      return reply.status(401).send({ error: 'Usuario no autenticado' });
    }

    // Leer tipo esperado y archivo
    let tipoEsperado: 'ENTRADA' | 'SALIDA' | undefined;
    let fileBuffer: Buffer | undefined;
    
    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        fileBuffer = await part.toBuffer();
      } else if (part.type === 'field' && part.fieldname === 'tipo') {
        tipoEsperado = part.value as 'ENTRADA' | 'SALIDA';
        console.log('📋 Tipo esperado desde frontend:', tipoEsperado);
      }
    }

    if (!fileBuffer) {
      return reply.status(400).send({ error: 'No se ha enviado ningún archivo' });
    }

    // Leer el archivo
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return reply.status(400).send({ error: 'El archivo está vacío' });
    }

    let exitosos = 0;
    let errores = 0;
    const detalleErrores: ErrorDetalle[] = [];

    // Procesar cada fila en una transacción
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (let i = 0; i < jsonData.length; i++) {
        const fila = jsonData[i];
        const linea = i + 2;

        try {
          // Validar campos requeridos
          if (!fila.sku || !fila.tipo || fila.cantidad === undefined) {
            throw new Error('Faltan campos requeridos: sku, tipo, cantidad');
          }

          // Normalizar datos
          const movimiento: MovimientoImport = {
            sku: String(fila.sku).trim().toUpperCase(),
            tipo: String(fila.tipo).trim().toUpperCase() as 'ENTRADA' | 'SALIDA',
            cantidad: Number(fila.cantidad),
            comentario: fila.comentario ? String(fila.comentario).trim() : undefined,
            referencia: fila.referencia ? String(fila.referencia).trim() : undefined,
          };

          // Validar tipo de movimiento
          if (movimiento.tipo !== 'ENTRADA' && movimiento.tipo !== 'SALIDA') {
            throw new Error('El tipo debe ser ENTRADA o SALIDA');
          }

          // Si se especificó un tipo esperado, validar que coincida
          if (tipoEsperado && movimiento.tipo !== tipoEsperado) {
            throw new Error(`Tipo incorrecto: esperado ${tipoEsperado}, recibido ${movimiento.tipo}`);
          }

          // Validar cantidad
          if (isNaN(movimiento.cantidad) || movimiento.cantidad <= 0) {
            throw new Error('La cantidad debe ser un número mayor a 0');
          }

          // Buscar el producto
          const productoResult = await client.query(
            'SELECT id, "stockActual" FROM productos WHERE sku = $1',
            [movimiento.sku]
          );

          if (productoResult.rows.length === 0) {
            throw new Error(`Producto con SKU ${movimiento.sku} no encontrado`);
          }

          const producto = productoResult.rows[0];
          const stockActual = producto.stockActual;
          const nuevoStock =
            movimiento.tipo === 'ENTRADA'
              ? stockActual + movimiento.cantidad
              : stockActual - movimiento.cantidad;

          // Validar stock suficiente para salidas
          if (movimiento.tipo === 'SALIDA' && nuevoStock < 0) {
            throw new Error(`Stock insuficiente. Stock actual: ${stockActual}`);
          }

          // Registrar el movimiento
          await client.query(
            `INSERT INTO movimientos_inventario 
             ("productoId", tipo, cantidad, "usuarioId", comentario, referencia)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              producto.id,
              movimiento.tipo,
              movimiento.cantidad,
              usuario.id,
              movimiento.comentario,
              movimiento.referencia,
            ]
          );

          // Actualizar el stock del producto
          await client.query(
            'UPDATE productos SET "stockActual" = $1, "updatedAt" = NOW() WHERE id = $2',
            [nuevoStock, producto.id]
          );

          exitosos++;
        } catch (error: any) {
          errores++;
          detalleErrores.push({
            linea,
            error: error.message || 'Error desconocido',
          });
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return reply.send({
      procesados: jsonData.length,
      exitosos,
      errores,
      detalleErrores: detalleErrores.slice(0, 50),
    });
  } catch (error: any) {
    console.error('Error al importar movimientos:', error);
    return reply.status(500).send({ error: error.message || 'Error al procesar el archivo' });
  }
};
