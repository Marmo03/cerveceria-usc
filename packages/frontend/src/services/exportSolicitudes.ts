import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ProductoAprobado {
  codigo: string
  nombre: string
  categoria: string
  cantidad: number
  unidad: string
  precioUnitario?: number
  subtotal?: number
  proveedor?: string
  notas?: string
}

export interface SolicitudAprobada {
  id: string
  fecha: string
  solicitante: string
  productos: ProductoAprobado[]
  total?: number
}

// ==================== EXPORTAR PRODUCTOS APROBADOS A EXCEL ====================

export function exportarProductosAprobadosExcel(solicitudes: SolicitudAprobada[]) {
  const wb = XLSX.utils.book_new()

  // Consolidar todos los productos de todas las solicitudes aprobadas
  const todosProductos: any[] = []
  
  solicitudes.forEach(solicitud => {
    solicitud.productos.forEach(producto => {
      todosProductos.push({
        'ID Solicitud': solicitud.id,
        'Fecha': solicitud.fecha,
        'Solicitante': solicitud.solicitante,
        'Codigo': producto.codigo,
        'Producto': producto.nombre,
        'Categoria': producto.categoria,
        'Cantidad': producto.cantidad,
        'Unidad': producto.unidad,
        'Precio Unitario': producto.precioUnitario ? `$${producto.precioUnitario.toLocaleString('es-CO')}` : 'N/A',
        'Subtotal': producto.subtotal ? `$${producto.subtotal.toLocaleString('es-CO')}` : 'N/A',
        'Proveedor': producto.proveedor || 'No especificado',
        'Notas': producto.notas || ''
      })
    })
  })

  // Hoja 1: Lista completa de productos
  const wsData = XLSX.utils.json_to_sheet(todosProductos)
  wsData['!cols'] = [
    { width: 12 },  // ID Solicitud
    { width: 12 },  // Fecha
    { width: 20 },  // Solicitante
    { width: 12 },  // Código
    { width: 35 },  // Producto
    { width: 15 },  // Categoría
    { width: 10 },  // Cantidad
    { width: 10 },  // Unidad
    { width: 15 },  // Precio
    { width: 15 },  // Subtotal
    { width: 20 },  // Proveedor
    { width: 30 }   // Notas
  ]
  
  XLSX.utils.book_append_sheet(wb, wsData, 'Productos Aprobados')

  // Hoja 2: Resumen por solicitud
  const resumenSolicitudes = solicitudes.map(s => ({
    'ID': s.id,
    'Fecha': s.fecha,
    'Solicitante': s.solicitante,
    'Total Productos': s.productos.length,
    'Total': s.total ? `$${s.total.toLocaleString('es-CO')}` : 'N/A'
  }))
  
  const wsResumen = XLSX.utils.json_to_sheet(resumenSolicitudes)
  wsResumen['!cols'] = [
    { width: 12 },  // ID
    { width: 12 },  // Fecha
    { width: 20 },  // Solicitante
    { width: 15 },  // Total Productos
    { width: 15 }   // Total
  ]
  
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Solicitudes')

  // Descargar archivo
  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `Productos_Aprobados_${fecha}.xlsx`)
}

// ==================== EXPORTAR PRODUCTOS APROBADOS A PDF ====================

export function exportarProductosAprobadosPDF(solicitudes: SolicitudAprobada[]) {
  const doc = new jsPDF()
  let yPos = 20

  // Encabezado
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Cerveceria USC', 105, 20, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Lista de Productos Aprobados para Pedido', 105, 30, { align: 'center' })
  
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

  // Iterar por cada solicitud
  solicitudes.forEach((solicitud, index) => {
    // Verificar si necesitamos nueva página
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    // Encabezado de solicitud
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text(`Solicitud ${solicitud.id}`, 14, yPos)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Fecha: ${solicitud.fecha} | Solicitante: ${solicitud.solicitante}`, 14, yPos + 5)
    
    yPos += 12

    // Tabla de productos
    const productosTable = solicitud.productos.map(p => [
      p.codigo,
      p.nombre,
      p.cantidad.toString(),
      p.unidad,
      p.precioUnitario ? `$${p.precioUnitario.toLocaleString('es-CO')}` : 'N/A',
      p.subtotal ? `$${p.subtotal.toLocaleString('es-CO')}` : 'N/A'
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Código', 'Producto', 'Cant.', 'Unidad', 'Precio', 'Subtotal']],
      body: productosTable,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 20 },    // Código
        1: { cellWidth: 70 },    // Producto
        2: { halign: 'center', cellWidth: 15 }, // Cantidad
        3: { halign: 'center', cellWidth: 18 }, // Unidad
        4: { halign: 'right', cellWidth: 25 },  // Precio
        5: { halign: 'right', cellWidth: 28 }   // Subtotal
      },
      margin: { left: 14, right: 14 }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10

    // Total de la solicitud
    if (solicitud.total) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(
        `Total: $${solicitud.total.toLocaleString('es-CO')}`,
        196,
        yPos,
        { align: 'right' }
      )
      yPos += 15
    } else {
      yPos += 10
    }

    // Línea separadora entre solicitudes
    if (index < solicitudes.length - 1) {
      doc.setDrawColor(200, 200, 200)
      doc.line(14, yPos, 196, yPos)
      yPos += 10
    }
  })

  // Resumen final
  if (solicitudes.length > 0) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text('RESUMEN', 14, yPos)
    yPos += 10

    const totalProductos = solicitudes.reduce((sum, s) => sum + s.productos.length, 0)
    const totalGeneral = solicitudes.reduce((sum, s) => sum + (s.total || 0), 0)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Total de solicitudes aprobadas: ${solicitudes.length}`, 14, yPos)
    doc.text(`Total de productos: ${totalProductos}`, 14, yPos + 6)
    if (totalGeneral > 0) {
      doc.text(`Total general: $${totalGeneral.toLocaleString('es-CO')}`, 14, yPos + 12)
    }
  }

  // Pie de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Pagina ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
    doc.text(
      'Generado por Cerveceria USC - Sistema de Gestion de Inventario',
      105,
      285,
      { align: 'center' }
    )
  }

  // Descargar
  const fechaArchivo = new Date().toISOString().split('T')[0]
  doc.save(`Productos_Aprobados_${fechaArchivo}.pdf`)
}
