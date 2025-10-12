// Casos de Uso - Importaciones CSV
// CU-IMP-01: Importar CSV de ventas/stock

import {
  Importacion,
  TipoImportacion,
  EstadoImportacion,
  MovimientoInventario,
  TipoMovimiento,
} from '../domain/entities.js'
import {
  ImportacionRepository,
  ProductoRepository,
  MovimientoInventarioRepository,
  ValidationError,
  NotFoundError,
} from '../domain/repositories.js'
import { EventPublisher, EventFactory } from '../domain/events/event-system.js'

// DTOs para importaciones
export interface IniciarImportacionRequest {
  tipo: TipoImportacion
  archivo: string // Nombre del archivo
  contenidoCSV: string // Contenido del archivo CSV
  usuarioId: string
  configuracion?: {
    separador?: string
    encoding?: string
    saltarPrimeraFila?: boolean
  }
}

export interface ResultadoImportacion {
  importacion: Importacion
  resumen: {
    totalFilas: number
    filasExitosas: number
    filasConError: number
    tiempoEjecucion: number // en segundos
  }
  errores: ErrorImportacion[]
  datosCreados: any[] // Productos, movimientos, etc. creados
}

export interface ErrorImportacion {
  fila: number
  columna?: string
  valor?: string
  error: string
  tipo: 'VALIDACION' | 'FORMATO' | 'REFERENCIA' | 'DUPLICADO'
}

export interface FilaCSV {
  numeroFila: number
  datos: Record<string, string>
}

// Interfaces para mapeo de columnas
export interface MapeoProductos {
  sku: string
  nombre: string
  categoria: string
  unidad: string
  costo: string
  stockInicial?: string
  stockMinimo?: string
  proveedor?: string
}

export interface MapeoStock {
  sku: string
  stockActual: string
  comentario?: string
}

export interface MapeoVentas {
  sku: string
  cantidad: string
  fecha?: string
  cliente?: string
  precio?: string
}

// CU-IMP-01: Importar CSV
export class ImportarCSVUseCase {
  constructor(
    private importacionRepo: ImportacionRepository,
    private productoRepo: ProductoRepository,
    private movimientoRepo: MovimientoInventarioRepository,
    private eventPublisher: EventPublisher
  ) {}

  async execute(
    request: IniciarImportacionRequest
  ): Promise<ResultadoImportacion> {
    const tiempoInicio = Date.now()

    // Validar request
    this.validarRequest(request)

    // Crear registro de importación
    const importacion = await this.importacionRepo.create({
      tipo: request.tipo,
      estado: EstadoImportacion.PROCESANDO,
      archivo: request.archivo,
      usuarioId: request.usuarioId,
      fechaInicio: new Date(),
    })

    try {
      // Parsear CSV
      const filas = this.parsearCSV(request.contenidoCSV, request.configuracion)

      // Procesar según tipo
      let resultado: ResultadoImportacion

      switch (request.tipo) {
        case TipoImportacion.PRODUCTOS:
          resultado = await this.procesarImportacionProductos(
            importacion,
            filas
          )
          break
        case TipoImportacion.STOCK:
          resultado = await this.procesarImportacionStock(importacion, filas)
          break
        case TipoImportacion.VENTAS:
          resultado = await this.procesarImportacionVentas(importacion, filas)
          break
        default:
          throw new ValidationError(
            `Tipo de importación no soportado: ${request.tipo}`
          )
      }

      // Calcular tiempo de ejecución
      const tiempoEjecucion = (Date.now() - tiempoInicio) / 1000
      resultado.resumen.tiempoEjecucion = tiempoEjecucion

      // Actualizar importación con resultado
      const estadoFinal =
        resultado.errores.length === 0
          ? EstadoImportacion.COMPLETADA
          : resultado.resumen.filasExitosas > 0
            ? EstadoImportacion.PARCIAL
            : EstadoImportacion.FALLIDA

      await this.importacionRepo.update(importacion.id, {
        estado: estadoFinal,
        fechaFin: new Date(),
        resumenJSON: resultado.resumen,
        erroresJSON: resultado.errores,
      })

      resultado.importacion =
        (await this.importacionRepo.findById(importacion.id)) || importacion

      return resultado
    } catch (error) {
      // Marcar importación como fallida
      await this.importacionRepo.update(importacion.id, {
        estado: EstadoImportacion.FALLIDA,
        fechaFin: new Date(),
        erroresJSON: [
          {
            fila: 0,
            error: error instanceof Error ? error.message : String(error),
            tipo: 'VALIDACION',
          },
        ],
      })

      throw error
    }
  }

  private validarRequest(request: IniciarImportacionRequest): void {
    if (!request.tipo) {
      throw new ValidationError('Tipo de importación es requerido')
    }
    if (!request.archivo) {
      throw new ValidationError('Nombre de archivo es requerido')
    }
    if (!request.contenidoCSV) {
      throw new ValidationError('Contenido CSV es requerido')
    }
    if (!request.usuarioId) {
      throw new ValidationError('ID de usuario es requerido')
    }
  }

  private parsearCSV(contenido: string, configuracion?: any): FilaCSV[] {
    const separador = configuracion?.separador || ','
    const saltarPrimera = configuracion?.saltarPrimeraFila ?? true

    const lineas = contenido
      .split('\n')
      .filter((linea) => linea.trim().length > 0)

    if (lineas.length === 0) {
      throw new ValidationError('El archivo CSV está vacío')
    }

    // Obtener encabezados
    const encabezados = lineas[0]
      .split(separador)
      .map((h) => h.trim().replace(/"/g, ''))
    const filasInicio = saltarPrimera ? 1 : 0

    const filas: FilaCSV[] = []

    for (let i = filasInicio; i < lineas.length; i++) {
      const valores = lineas[i]
        .split(separador)
        .map((v) => v.trim().replace(/"/g, ''))

      const datos: Record<string, string> = {}
      encabezados.forEach((encabezado, index) => {
        datos[encabezado] = valores[index] || ''
      })

      filas.push({
        numeroFila: i + 1,
        datos,
      })
    }

    return filas
  }

  private async procesarImportacionProductos(
    importacion: Importacion,
    filas: FilaCSV[]
  ): Promise<ResultadoImportacion> {
    const errores: ErrorImportacion[] = []
    const datosCreados: any[] = []
    let filasExitosas = 0

    // Validar encabezados requeridos
    const encabezadosRequeridos = [
      'sku',
      'nombre',
      'categoria',
      'unidad',
      'costo',
    ]
    const primeraFila = filas[0]

    if (!primeraFila) {
      throw new ValidationError('No hay datos para procesar')
    }

    for (const encabezado of encabezadosRequeridos) {
      if (!primeraFila.datos.hasOwnProperty(encabezado)) {
        throw new ValidationError(
          `Encabezado requerido faltante: ${encabezado}`
        )
      }
    }

    // Procesar cada fila
    for (const fila of filas) {
      try {
        // Validar datos requeridos
        const erroresFila = this.validarFilaProducto(fila)
        if (erroresFila.length > 0) {
          errores.push(...erroresFila)
          continue
        }

        // Verificar si el producto ya existe
        const productoExistente = await this.productoRepo.findBySku(
          fila.datos.sku
        )
        if (productoExistente) {
          errores.push({
            fila: fila.numeroFila,
            columna: 'sku',
            valor: fila.datos.sku,
            error: 'El producto ya existe',
            tipo: 'DUPLICADO',
          })
          continue
        }

        // Crear producto
        const producto = await this.productoRepo.create({
          sku: fila.datos.sku,
          nombre: fila.datos.nombre,
          categoria: fila.datos.categoria,
          unidad: fila.datos.unidad,
          costo: parseFloat(fila.datos.costo),
          stockActual: parseInt(fila.datos.stockInicial || '0'),
          stockMin: parseInt(fila.datos.stockMinimo || '0'),
          proveedorId: undefined, // TODO: Resolver proveedor si viene en el CSV
          leadTime: parseInt(fila.datos.leadTime || '7'),
          isActive: true,
        })

        datosCreados.push(producto)
        filasExitosas++

        // Si hay stock inicial, crear movimiento
        if (fila.datos.stockInicial && parseInt(fila.datos.stockInicial) > 0) {
          const movimiento = await this.movimientoRepo.create({
            productoId: producto.id,
            tipo: TipoMovimiento.ENTRADA,
            cantidad: parseInt(fila.datos.stockInicial),
            fecha: new Date(),
            usuarioId: importacion.usuarioId,
            comentario: 'Stock inicial - Importación CSV',
            referencia: `IMP-${importacion.id}`,
          })

          // Emitir evento de inventario actualizado
          const evento = EventFactory.crearEventoInventarioActualizado(
            producto.id,
            0,
            producto.stockActual,
            TipoMovimiento.ENTRADA,
            parseInt(fila.datos.stockInicial)
          )
          await this.eventPublisher.notify(evento)
        }
      } catch (error) {
        errores.push({
          fila: fila.numeroFila,
          error: error instanceof Error ? error.message : String(error),
          tipo: 'VALIDACION',
        })
      }
    }

    return {
      importacion,
      resumen: {
        totalFilas: filas.length,
        filasExitosas,
        filasConError: errores.length,
        tiempoEjecucion: 0, // Se calculará en el método principal
      },
      errores,
      datosCreados,
    }
  }

  private async procesarImportacionStock(
    importacion: Importacion,
    filas: FilaCSV[]
  ): Promise<ResultadoImportacion> {
    const errores: ErrorImportacion[] = []
    const datosCreados: any[] = []
    let filasExitosas = 0

    // Validar encabezados
    const encabezadosRequeridos = ['sku', 'stockActual']
    const primeraFila = filas[0]

    for (const encabezado of encabezadosRequeridos) {
      if (!primeraFila?.datos.hasOwnProperty(encabezado)) {
        throw new ValidationError(
          `Encabezado requerido faltante: ${encabezado}`
        )
      }
    }

    for (const fila of filas) {
      try {
        // Validar datos
        const erroresFila = this.validarFilaStock(fila)
        if (erroresFila.length > 0) {
          errores.push(...erroresFila)
          continue
        }

        // Buscar producto
        const producto = await this.productoRepo.findBySku(fila.datos.sku)
        if (!producto) {
          errores.push({
            fila: fila.numeroFila,
            columna: 'sku',
            valor: fila.datos.sku,
            error: 'Producto no encontrado',
            tipo: 'REFERENCIA',
          })
          continue
        }

        const nuevoStock = parseInt(fila.datos.stockActual)
        const stockAnterior = producto.stockActual
        const diferencia = nuevoStock - stockAnterior

        // Actualizar stock
        const productoActualizado = await this.productoRepo.actualizarStock(
          producto.id,
          nuevoStock
        )

        // Crear movimiento de ajuste
        if (diferencia !== 0) {
          const movimiento = await this.movimientoRepo.create({
            productoId: producto.id,
            tipo:
              diferencia > 0 ? TipoMovimiento.ENTRADA : TipoMovimiento.SALIDA,
            cantidad: Math.abs(diferencia),
            fecha: new Date(),
            usuarioId: importacion.usuarioId,
            comentario:
              fila.datos.comentario || 'Ajuste de stock - Importación CSV',
            referencia: `IMP-${importacion.id}`,
          })

          datosCreados.push(movimiento)

          // Emitir evento
          const evento = EventFactory.crearEventoInventarioActualizado(
            producto.id,
            stockAnterior,
            nuevoStock,
            diferencia > 0 ? TipoMovimiento.ENTRADA : TipoMovimiento.SALIDA,
            Math.abs(diferencia)
          )
          await this.eventPublisher.notify(evento)
        }

        filasExitosas++
      } catch (error) {
        errores.push({
          fila: fila.numeroFila,
          error: error instanceof Error ? error.message : String(error),
          tipo: 'VALIDACION',
        })
      }
    }

    return {
      importacion,
      resumen: {
        totalFilas: filas.length,
        filasExitosas,
        filasConError: errores.length,
        tiempoEjecucion: 0,
      },
      errores,
      datosCreados,
    }
  }

  private async procesarImportacionVentas(
    importacion: Importacion,
    filas: FilaCSV[]
  ): Promise<ResultadoImportacion> {
    const errores: ErrorImportacion[] = []
    const datosCreados: any[] = []
    let filasExitosas = 0

    // Validar encabezados
    const encabezadosRequeridos = ['sku', 'cantidad']
    const primeraFila = filas[0]

    for (const encabezado of encabezadosRequeridos) {
      if (!primeraFila?.datos.hasOwnProperty(encabezado)) {
        throw new ValidationError(
          `Encabezado requerido faltante: ${encabezado}`
        )
      }
    }

    for (const fila of filas) {
      try {
        // Validar datos
        const erroresFila = this.validarFilaVentas(fila)
        if (erroresFila.length > 0) {
          errores.push(...erroresFila)
          continue
        }

        // Buscar producto
        const producto = await this.productoRepo.findBySku(fila.datos.sku)
        if (!producto) {
          errores.push({
            fila: fila.numeroFila,
            columna: 'sku',
            valor: fila.datos.sku,
            error: 'Producto no encontrado',
            tipo: 'REFERENCIA',
          })
          continue
        }

        const cantidad = parseInt(fila.datos.cantidad)

        // Verificar stock suficiente
        if (producto.stockActual < cantidad) {
          errores.push({
            fila: fila.numeroFila,
            columna: 'cantidad',
            valor: fila.datos.cantidad,
            error: `Stock insuficiente. Disponible: ${producto.stockActual}`,
            tipo: 'VALIDACION',
          })
          continue
        }

        // Crear movimiento de salida por venta
        const movimiento = await this.movimientoRepo.create({
          productoId: producto.id,
          tipo: TipoMovimiento.SALIDA,
          cantidad,
          fecha: fila.datos.fecha ? new Date(fila.datos.fecha) : new Date(),
          usuarioId: importacion.usuarioId,
          comentario: `Venta importada - Cliente: ${fila.datos.cliente || 'N/A'}`,
          referencia: `IMP-${importacion.id}`,
        })

        // Actualizar stock
        const nuevoStock = producto.stockActual - cantidad
        await this.productoRepo.actualizarStock(producto.id, nuevoStock)

        datosCreados.push(movimiento)

        // Emitir evento
        const evento = EventFactory.crearEventoInventarioActualizado(
          producto.id,
          producto.stockActual,
          nuevoStock,
          TipoMovimiento.SALIDA,
          cantidad
        )
        await this.eventPublisher.notify(evento)

        filasExitosas++
      } catch (error) {
        errores.push({
          fila: fila.numeroFila,
          error: error instanceof Error ? error.message : String(error),
          tipo: 'VALIDACION',
        })
      }
    }

    return {
      importacion,
      resumen: {
        totalFilas: filas.length,
        filasExitosas,
        filasConError: errores.length,
        tiempoEjecucion: 0,
      },
      errores,
      datosCreados,
    }
  }

  // Métodos de validación específicos
  private validarFilaProducto(fila: FilaCSV): ErrorImportacion[] {
    const errores: ErrorImportacion[] = []

    if (!fila.datos.sku?.trim()) {
      errores.push({
        fila: fila.numeroFila,
        columna: 'sku',
        error: 'SKU es requerido',
        tipo: 'VALIDACION',
      })
    }

    if (!fila.datos.nombre?.trim()) {
      errores.push({
        fila: fila.numeroFila,
        columna: 'nombre',
        error: 'Nombre es requerido',
        tipo: 'VALIDACION',
      })
    }

    if (!fila.datos.costo || isNaN(parseFloat(fila.datos.costo))) {
      errores.push({
        fila: fila.numeroFila,
        columna: 'costo',
        valor: fila.datos.costo,
        error: 'Costo debe ser un número válido',
        tipo: 'FORMATO',
      })
    }

    return errores
  }

  private validarFilaStock(fila: FilaCSV): ErrorImportacion[] {
    const errores: ErrorImportacion[] = []

    if (!fila.datos.sku?.trim()) {
      errores.push({
        fila: fila.numeroFila,
        columna: 'sku',
        error: 'SKU es requerido',
        tipo: 'VALIDACION',
      })
    }

    if (!fila.datos.stockActual || isNaN(parseInt(fila.datos.stockActual))) {
      errores.push({
        fila: fila.numeroFila,
        columna: 'stockActual',
        valor: fila.datos.stockActual,
        error: 'Stock actual debe ser un número válido',
        tipo: 'FORMATO',
      })
    }

    return errores
  }

  private validarFilaVentas(fila: FilaCSV): ErrorImportacion[] {
    const errores: ErrorImportacion[] = []

    if (!fila.datos.sku?.trim()) {
      errores.push({
        fila: fila.numeroFila,
        columna: 'sku',
        error: 'SKU es requerido',
        tipo: 'VALIDACION',
      })
    }

    if (!fila.datos.cantidad || isNaN(parseInt(fila.datos.cantidad))) {
      errores.push({
        fila: fila.numeroFila,
        columna: 'cantidad',
        valor: fila.datos.cantidad,
        error: 'Cantidad debe ser un número válido',
        tipo: 'FORMATO',
      })
    }

    return errores
  }
}

// CU-IMP-02: Consultar estado de importaciones
export interface ConsultarImportacionesRequest {
  usuarioId?: string
  tipo?: TipoImportacion
  estado?: EstadoImportacion
  fechaDesde?: Date
  fechaHasta?: Date
}

export class ConsultarImportacionesUseCase {
  constructor(private importacionRepo: ImportacionRepository) {}

  async execute(
    request: ConsultarImportacionesRequest
  ): Promise<Importacion[]> {
    return this.importacionRepo.findAll({
      usuarioId: request.usuarioId,
      tipo: request.tipo,
      estado: request.estado,
      fechaDesde: request.fechaDesde,
      fechaHasta: request.fechaHasta,
    })
  }

  async obtenerDetalle(importacionId: string): Promise<Importacion> {
    const importacion = await this.importacionRepo.findById(importacionId)
    if (!importacion) {
      throw new NotFoundError('Importación', importacionId)
    }
    return importacion
  }
}
