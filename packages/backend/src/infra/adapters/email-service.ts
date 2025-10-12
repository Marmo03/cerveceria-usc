// Adaptador para servicios de Email
// Implementa el envío de notificaciones por email

export interface EmailService {
  enviarAlerta(alerta: AlertaEmail): Promise<void>
  enviarNotificacionAprobacion(
    notificacion: NotificacionAprobacion
  ): Promise<void>
}

export interface AlertaEmail {
  destinatario: string
  tipo: 'STOCK_BAJO' | 'STOCK_CRITICO'
  productoId: string
  productoNombre: string
  stockActual: number
  stockMinimo: number
  mensaje: string
}

export interface NotificacionAprobacion {
  destinatario: string
  solicitudId: string
  tipoNotificacion:
    | 'NUEVA_SOLICITUD'
    | 'SOLICITUD_APROBADA'
    | 'SOLICITUD_RECHAZADA'
  producto: string
  cantidad: number
  solicitante: string
  mensaje: string
}

// Implementación mock para desarrollo
export class MockEmailService implements EmailService {
  async enviarAlerta(alerta: AlertaEmail): Promise<void> {
    console.log('📧 [MOCK EMAIL] Enviando alerta de stock:', {
      destinatario: alerta.destinatario,
      tipo: alerta.tipo,
      producto: alerta.productoNombre,
      mensaje: alerta.mensaje,
    })

    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  async enviarNotificacionAprobacion(
    notificacion: NotificacionAprobacion
  ): Promise<void> {
    console.log('📧 [MOCK EMAIL] Enviando notificación de aprobación:', {
      destinatario: notificacion.destinatario,
      tipo: notificacion.tipoNotificacion,
      solicitud: notificacion.solicitudId,
      mensaje: notificacion.mensaje,
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

// Implementación real usando un servicio de email (ejemplo con nodemailer)
export class NodemailerEmailService implements EmailService {
  private transporter: any

  constructor(config: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }) {
    // En implementación real:
    // this.transporter = nodemailer.createTransporter(config);
    console.log('📧 Email service configurado con:', config.host)
  }

  async enviarAlerta(alerta: AlertaEmail): Promise<void> {
    const mailOptions = {
      from: 'sistema@cerveceria-usc.edu.co',
      to: alerta.destinatario,
      subject: `🚨 Alerta de Stock - ${alerta.productoNombre}`,
      html: this.generarTemplateAlerta(alerta),
    }

    try {
      // await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de alerta enviado a:', alerta.destinatario)
    } catch (error) {
      console.error('❌ Error enviando email de alerta:', error)
      throw error
    }
  }

  async enviarNotificacionAprobacion(
    notificacion: NotificacionAprobacion
  ): Promise<void> {
    const mailOptions = {
      from: 'sistema@cerveceria-usc.edu.co',
      to: notificacion.destinatario,
      subject: this.obtenerSubjetoAprobacion(notificacion.tipoNotificacion),
      html: this.generarTemplateAprobacion(notificacion),
    }

    try {
      // await this.transporter.sendMail(mailOptions);
      console.log(
        '✅ Email de aprobación enviado a:',
        notificacion.destinatario
      )
    } catch (error) {
      console.error('❌ Error enviando email de aprobación:', error)
      throw error
    }
  }

  private generarTemplateAlerta(alerta: AlertaEmail): string {
    const prioridadColor =
      alerta.tipo === 'STOCK_CRITICO' ? '#ff4444' : '#ff8800'

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${prioridadColor};">
          🚨 Alerta de Stock ${alerta.tipo === 'STOCK_CRITICO' ? 'Crítico' : 'Bajo'}
        </h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h3>${alerta.productoNombre}</h3>
          <p><strong>Stock actual:</strong> ${alerta.stockActual} unidades</p>
          <p><strong>Stock mínimo:</strong> ${alerta.stockMinimo} unidades</p>
          <p><strong>Mensaje:</strong> ${alerta.mensaje}</p>
        </div>
        <p style="margin-top: 20px;">
          Por favor, revise el inventario y considere generar una solicitud de compra.
        </p>
        <p style="color: #666; font-size: 12px;">
          Este es un mensaje automático del sistema de gestión de inventario.
        </p>
      </div>
    `
  }

  private generarTemplateAprobacion(
    notificacion: NotificacionAprobacion
  ): string {
    let colorEstado = '#007bff'
    let iconoEstado = '📋'

    if (notificacion.tipoNotificacion === 'SOLICITUD_APROBADA') {
      colorEstado = '#28a745'
      iconoEstado = '✅'
    } else if (notificacion.tipoNotificacion === 'SOLICITUD_RECHAZADA') {
      colorEstado = '#dc3545'
      iconoEstado = '❌'
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${colorEstado};">
          ${iconoEstado} ${this.obtenerTituloAprobacion(notificacion.tipoNotificacion)}
        </h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>Solicitud:</strong> ${notificacion.solicitudId}</p>
          <p><strong>Producto:</strong> ${notificacion.producto}</p>
          <p><strong>Cantidad:</strong> ${notificacion.cantidad} unidades</p>
          <p><strong>Solicitante:</strong> ${notificacion.solicitante}</p>
          <hr>
          <p>${notificacion.mensaje}</p>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Este es un mensaje automático del sistema de solicitudes de compra.
        </p>
      </div>
    `
  }

  private obtenerSubjetoAprobacion(tipo: string): string {
    switch (tipo) {
      case 'NUEVA_SOLICITUD':
        return '📋 Nueva Solicitud de Compra Pendiente'
      case 'SOLICITUD_APROBADA':
        return '✅ Solicitud de Compra Aprobada'
      case 'SOLICITUD_RECHAZADA':
        return '❌ Solicitud de Compra Rechazada'
      default:
        return '📋 Notificación de Solicitud de Compra'
    }
  }

  private obtenerTituloAprobacion(tipo: string): string {
    switch (tipo) {
      case 'NUEVA_SOLICITUD':
        return 'Nueva Solicitud Pendiente'
      case 'SOLICITUD_APROBADA':
        return 'Solicitud Aprobada'
      case 'SOLICITUD_RECHAZADA':
        return 'Solicitud Rechazada'
      default:
        return 'Notificación de Solicitud'
    }
  }
}
