import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de base de datos...')

  // Crear roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrador del sistema con todos los permisos',
      permissions: JSON.stringify({
        users: ['create', 'read', 'update', 'delete'],
        products: ['create', 'read', 'update', 'delete'],
        inventory: ['create', 'read', 'update', 'delete'],
        sales: ['create', 'read', 'update', 'delete', 'approve'],
        reports: ['read'],
        imports: ['create', 'read'],
      }),
    },
  })

  const operarioRole = await prisma.role.upsert({
    where: { name: 'OPERARIO' },
    update: {},
    create: {
      name: 'OPERARIO',
      description: 'Operario con permisos básicos',
      permissions: JSON.stringify({
        products: ['read'],
        inventory: ['create', 'read', 'update'],
        sales: ['create', 'read'],
        reports: ['read'],
      }),
    },
  })

  const aprobadorRole = await prisma.role.upsert({
    where: { name: 'APROBADOR' },
    update: {},
    create: {
      name: 'APROBADOR',
      description: 'Aprobador de ventas e inventario',
      permissions: JSON.stringify({
        products: ['read'],
        inventory: ['read', 'approve'],
        sales: ['read', 'approve'],
        reports: ['read'],
      }),
    },
  })

  const analistaRole = await prisma.role.upsert({
    where: { name: 'ANALISTA' },
    update: {},
    create: {
      name: 'ANALISTA',
      description: 'Analista de datos y reportes',
      permissions: JSON.stringify({
        products: ['read'],
        inventory: ['read'],
        sales: ['read'],
        reports: ['read', 'create'],
        imports: ['read'],
      }),
    },
  })

  console.log('✅ Roles creados:', {
    admin: adminRole.id,
    operario: operarioRole.id,
    aprobador: aprobadorRole.id,
    analista: analistaRole.id,
  })

  // Crear usuarios de prueba
  const hashedPassword = await bcrypt.hash('123456', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cerveceria-usc.edu.co' },
    update: {},
    create: {
      email: 'admin@cerveceria-usc.edu.co',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'USC',
      roleId: adminRole.id,
    },
  })

  const operarioUser = await prisma.user.upsert({
    where: { email: 'operario@cerveceria-usc.edu.co' },
    update: {},
    create: {
      email: 'operario@cerveceria-usc.edu.co',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      roleId: operarioRole.id,
    },
  })

  const aprobadorUser = await prisma.user.upsert({
    where: { email: 'aprobador@cerveceria-usc.edu.co' },
    update: {},
    create: {
      email: 'aprobador@cerveceria-usc.edu.co',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'García',
      roleId: aprobadorRole.id,
    },
  })

  const analistaUser = await prisma.user.upsert({
    where: { email: 'analista@cerveceria-usc.edu.co' },
    update: {},
    create: {
      email: 'analista@cerveceria-usc.edu.co',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'López',
      roleId: analistaRole.id,
    },
  })

  console.log('✅ Usuarios creados:', {
    admin: adminUser.email,
    operario: operarioUser.email,
    aprobador: aprobadorUser.email,
    analista: analistaUser.email,
  })

  // Crear productos de ejemplo
  const products = [
    {
      sku: 'CERV-001',
      nombre: 'Cerveza Artesanal IPA',
      categoria: 'Producto Terminado',
      unidad: 'L',
      stockActual: 100,
      stockMin: 20,
      costo: 8500,
    },
    {
      sku: 'CERV-002', 
      nombre: 'Cerveza Artesanal Lager',
      categoria: 'Producto Terminado',
      unidad: 'L',
      stockActual: 150,
      stockMin: 30,
      costo: 7500,
    },
    {
      sku: 'CERV-003',
      nombre: 'Cerveza Artesanal Stout',
      categoria: 'Producto Terminado',
      unidad: 'L',
      stockActual: 80,
      stockMin: 15,
      costo: 9000,
    },
  ]

  for (const productData of products) {
    await prisma.producto.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData,
    })
  }

  console.log('✅ Productos de ejemplo creados')
  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })