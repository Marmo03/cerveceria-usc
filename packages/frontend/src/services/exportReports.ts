import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Interfaces que coinciden con el store de reports
export interface KPIData {
  rotacionInventario?: number
  stockoutRate?: number
  costoInventario?: number
  tiempoAprobacion?: number
  // Compatibilidad con posibles nombres alternativos
  totalVentas?: number
  ventasDiarias?: number
  productosVendidos?: number
  stockBajo?: number
  rotacionPromedio?: number
  valorInventario?: number
}

export interface TopProduct {
  id?: string
  codigo?: string
  nombre: string
  categoria: string
  unidad?: string
  movimientos?: number
  cantidadMovida?: number
  cantidadVendida?: number
  rotacion?: number
  stockActual?: number
  valorMovido?: number
  ingresos?: number
}

export interface MovimientoTemporal {
  fecha: string
  entradas?: number
  salidas?: number
  ventas?: number
  compras?: number
  ajustes?: number
}

export interface Alerta {
  id?: string
  tipo?: string
  type?: string
  title?: string
  producto?: string
  description?: string
  mensaje?: string
  fecha?: string
  action?: string
}

// ==================== EXPORTAR A EXCEL ====================

export function exportarReporteExcel(data: {
  kpis: KPIData
  topProducts: TopProduct[]
  movimientos: MovimientoTemporal[]
  alertas: Alerta[]
}) {
  const wb = XLSX.utils.book_new()

  // Hoja 1: KPIs
  const kpiData = [
    ['INDICADORES CLAVE DE RENDIMIENTO (KPIs)'],
    ['Generado el: ' + new Date().toLocaleString('es-CO')],
    [''],
    ['Métrica', 'Valor'],
    ['Rotación de Inventario', data.kpis.rotacionInventario?.toFixed(2) || '0'],
    ['Tasa de Stockout', `${(data.kpis.stockoutRate || 0).toFixed(2)}%`],
    ['Costo de Inventario', `$${(data.kpis.costoInventario || 0).toLocaleString('es-CO')}`],
    ['Tiempo Promedio de Aprobación', `${(data.kpis.tiempoAprobacion || 0).toFixed(2)} horas`],
  ]
  
  // Agregar métricas adicionales si existen
  if (data.kpis.totalVentas) {
    kpiData.push(['Total Ventas', `$${data.kpis.totalVentas.toLocaleString('es-CO')}`])
  }
  if (data.kpis.valorInventario) {
    kpiData.push(['Valor del Inventario', `$${data.kpis.valorInventario.toLocaleString('es-CO')}`])
  }
  
  const wsKPI = XLSX.utils.aoa_to_sheet(kpiData)
  wsKPI['!cols'] = [{ width: 35 }, { width: 25 }]
  XLSX.utils.book_append_sheet(wb, wsKPI, 'KPIs')

  // Hoja 2: Top Productos
  if (data.topProducts.length > 0) {
    const topProductsData = [
      ['TOP PRODUCTOS MÁS ACTIVOS'],
      ['Generado el: ' + new Date().toLocaleString('es-CO')],
      [''],
      ['Código', 'Producto', 'Categoría', 'Movimientos', 'Cantidad Movida', 'Rotación', 'Stock Actual', 'Valor Movido'],
      ...data.topProducts.map(p => [
        p.codigo || '',
        p.nombre || '',
        p.categoria || '',
        p.movimientos || p.cantidadVendida || 0,
        p.cantidadMovida || 0,
        (p.rotacion || 0).toFixed(2),
        p.stockActual || 0,
        `$${(p.valorMovido || p.ingresos || 0).toLocaleString('es-CO')}`
      ])
    ]
    const wsTop = XLSX.utils.aoa_to_sheet(topProductsData)
    wsTop['!cols'] = [
      { width: 12 }, // Código
      { width: 30 }, // Producto
      { width: 20 }, // Categoría
      { width: 12 }, // Movimientos
      { width: 15 }, // Cantidad
      { width: 12 }, // Rotación
      { width: 12 }, // Stock
      { width: 18 }  // Valor
    ]
    XLSX.utils.book_append_sheet(wb, wsTop, 'Top Productos')
  }

  // Hoja 3: Movimientos Temporales
  if (data.movimientos.length > 0) {
    const movimientosData = [
      ['MOVIMIENTOS DE INVENTARIO'],
      ['Generado el: ' + new Date().toLocaleString('es-CO')],
      [''],
      ['Fecha', 'Entradas', 'Salidas', 'Ventas', 'Compras', 'Ajustes'],
      ...data.movimientos.map(m => [
        m.fecha,
        m.entradas || 0,
        m.salidas || 0,
        m.ventas || 0,
        m.compras || 0,
        m.ajustes || 0
      ])
    ]
    const wsMov = XLSX.utils.aoa_to_sheet(movimientosData)
    wsMov['!cols'] = [
      { width: 15 }, // Fecha
      { width: 12 }, // Entradas
      { width: 12 }, // Salidas
      { width: 12 }, // Ventas
      { width: 12 }, // Compras
      { width: 12 }  // Ajustes
    ]
    XLSX.utils.book_append_sheet(wb, wsMov, 'Movimientos')
  }

  // Hoja 4: Alertas
  if (data.alertas.length > 0) {
    const alertasData = [
      ['ALERTAS Y NOTIFICACIONES'],
      ['Generado el: ' + new Date().toLocaleString('es-CO')],
      [''],
      ['Tipo', 'Título/Producto', 'Descripción/Mensaje', 'Acción/Fecha'],
      ...data.alertas.map(a => [
        a.tipo || a.type || 'Info',
        a.title || a.producto || '',
        a.description || a.mensaje || '',
        a.action || a.fecha || ''
      ])
    ]
    const wsAlertas = XLSX.utils.aoa_to_sheet(alertasData)
    wsAlertas['!cols'] = [
      { width: 15 }, // Tipo
      { width: 25 }, // Título
      { width: 50 }, // Descripción
      { width: 20 }  // Acción
    ]
    XLSX.utils.book_append_sheet(wb, wsAlertas, 'Alertas')
  }

  // Descargar archivo
  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `Reporte_Cerveceria_${fecha}.xlsx`)
}

// ==================== EXPORTAR A PDF ====================

export function exportarReportePDF(data: {
  kpis: KPIData
  topProducts: TopProduct[]
  movimientos: MovimientoTemporal[]
  alertas: Alerta[]
}) {
  const doc = new jsPDF()
  let yPos = 20

  // Encabezado principal
  doc.setFillColor(59, 130, 246) // Azul
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Cerveceria USC', 105, 20, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Inventario y KPIs', 105, 30, { align: 'center' })
  
  const fecha = new Date().toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.setFontSize(10)
  doc.text(fecha, 105, 36, { align: 'center' })

  yPos = 50
  doc.setTextColor(0, 0, 0)

  // Sección 1: KPIs
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246)
  doc.text('INDICADORES CLAVE DE RENDIMIENTO', 14, yPos)
  yPos += 10

  const kpiTable = [
    ['Rotación de Inventario', (data.kpis.rotacionInventario || 0).toFixed(2)],
    ['Tasa de Stockout', `${(data.kpis.stockoutRate || 0).toFixed(2)}%`],
    ['Costo de Inventario', `$${(data.kpis.costoInventario || 0).toLocaleString('es-CO')}`],
    ['Tiempo Aprobación', `${(data.kpis.tiempoAprobacion || 0).toFixed(2)} hrs`],
  ]

  // Agregar métricas adicionales si existen
  if (data.kpis.totalVentas) {
    kpiTable.push(['Total Ventas', `$${data.kpis.totalVentas.toLocaleString('es-CO')}`])
  }
  if (data.kpis.valorInventario) {
    kpiTable.push(['Valor Inventario', `$${data.kpis.valorInventario.toLocaleString('es-CO')}`])
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: kpiTable,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right', cellWidth: 76 }
    }
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Sección 2: Top Productos
  if (data.topProducts.length > 0) {
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text('TOP PRODUCTOS MAS ACTIVOS', 14, yPos)
    yPos += 10

    const topProductsTable = data.topProducts.slice(0, 15).map(p => [
      p.codigo || '',
      p.nombre || '',
      p.categoria || '',
      (p.movimientos || p.cantidadVendida || 0).toString(),
      `$${(p.valorMovido || p.ingresos || 0).toLocaleString('es-CO')}`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Código', 'Producto', 'Categoría', 'Movs', 'Valor']],
      body: topProductsTable,
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 65 },
        2: { cellWidth: 35 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 31 }
      }
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Sección 3: Movimientos Temporales
  if (data.movimientos.length > 0) {
    if (yPos > 200 || data.movimientos.length > 10) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text('MOVIMIENTOS DE INVENTARIO', 14, yPos)
    yPos += 10

    const movimientosTable = data.movimientos.slice(0, 15).map(m => [
      m.fecha,
      (m.entradas || 0).toString(),
      (m.salidas || 0).toString(),
      (m.ventas || 0).toString(),
      (m.compras || 0).toString()
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Fecha', 'Entradas', 'Salidas', 'Ventas', 'Compras']],
      body: movimientosTable,
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { halign: 'center', cellWidth: 29 },
        2: { halign: 'center', cellWidth: 29 },
        3: { halign: 'center', cellWidth: 29 },
        4: { halign: 'center', cellWidth: 29 }
      }
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Sección 4: Alertas
  if (data.alertas.length > 0) {
    if (yPos > 220 || data.alertas.length > 8) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text('ALERTAS Y NOTIFICACIONES', 14, yPos)
    yPos += 10

    const alertasTable = data.alertas.slice(0, 12).map(a => [
      a.tipo || a.type || 'Info',
      a.title || a.producto || '',
      a.description || a.mensaje || '',
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Tipo', 'Título', 'Descripción']],
      body: alertasTable,
      theme: 'striped',
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 101 }
      }
    })
  }

  // Pie de página en todas las páginas
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Página ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
    doc.text(
      'Generado por Cervecería USC - Sistema de Gestión de Inventario',
      105,
      285,
      { align: 'center' }
    )
  }

  // Descargar PDF
  const fechaArchivo = new Date().toISOString().split('T')[0]
  doc.save(`Reporte_Cerveceria_${fechaArchivo}.pdf`)
}
