const pg = require('pg');
const { randomUUID } = require('crypto');

async function testCreateProduct() {
  const client = new pg.Client({
    host: '127.0.0.1',
    port: 5433,
    database: 'cerveceria_usc',
    user: 'cerveceria_user',
    password: 'cerveceria_password',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    const id = randomUUID();
    const now = new Date();

    const result = await client.query(`
      INSERT INTO productos (
        id, sku, nombre, categoria, unidad, costo,
        "stockActual", "stockMin", "leadTime", "proveedorId",
        "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      id,
      'TEST003',
      'Producto Test 3',
      'Cerveza',
      'L',
      15000,
      100,
      20,
      7,
      null,
      true,
      now,
      now
    ]);

    console.log('✅ Producto creado exitosamente:');
    console.log(result.rows[0]);

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCreateProduct();
