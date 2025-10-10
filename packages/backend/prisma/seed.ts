import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de base de datos...')

  // Crear roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrador del sistema con todos los permisos',
      permissions: {
        users: ['create', 'read', 'update', 'delete'],
        products: ['create', 'read', 'update', 'delete'],
        inventory: ['create', 'read', 'update', 'delete'],
        sales: ['create', 'read', 'update', 'delete', 'approve'],
        reports: ['read'],
        imports: ['create', 'read'],
      },
    },
  })

  const operarioRole = await prisma.role.upsert({
    where: { name: 'Operario' },
    update: {},
    create: {
      name: 'Operario',
      description: 'Operario con permisos básicos',
      permissions: {
        products: ['read'],
        inventory: ['create', 'read', 'update'],
        sales: ['create', 'read'],
        reports: ['read'],
      },
    },
  })

  const aprobadorRole = await prisma.role.upsert({
    where: { name: 'Aprobador' },
    update: {},
    create: {
      name: 'Aprobador',
      description: 'Aprobador de ventas e inventario',
      permissions: {
        products: ['read'],
        inventory: ['read', 'approve'],
        sales: ['read', 'approve'],
        reports: ['read'],
      },
    },
  })

  const analistaRole = await prisma.role.upsert({
    where: { name: 'Analista' },
    update: {},
    create: {
      name: 'Analista',
      description: 'Analista de datos y reportes',
      permissions: {
        products: ['read'],
        inventory: ['read'],
        sales: ['read'],
        reports: ['read', 'create'],
        imports: ['read'],
      },
    },
  })

  console.log('✅ Roles creados:', {
    admin: adminRole.id,
    operario: operarioRole.id,
    aprobador: aprobadorRole.id,
    analista: analistaRole.id,
  })

  // Crear usuario administrador por defecto
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
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

  console.log('✅ Usuario administrador creado:', adminUser.email)

  // Crear productos de ejemplo
  const products = [
    {
      sku: 'CERV-001',
      name: 'Cerveza Artesanal IPA',
      description: 'Cerveza artesanal estilo India Pale Ale',
      unitPrice: 8500,
      initialStock: 100,
      currentStock: 100,
      minStock: 20,
    },
    {
      sku: 'CERV-002',
      name: 'Cerveza Artesanal Lager',
      description: 'Cerveza artesanal estilo Lager',
      unitPrice: 7500,
      initialStock: 150,
      currentStock: 150,
      minStock: 30,
    },
    {
      sku: 'CERV-003',
      name: 'Cerveza Artesanal Stout',
      description: 'Cerveza artesanal estilo Stout',
      unitPrice: 9000,
      initialStock: 80,
      currentStock: 80,
      minStock: 15,
    },
  ]

  for (const productData of products) {
    await prisma.product.upsert({
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