const pg = require('pg');

async function checkPersistence() {
  const client = new pg.Client({
    host: '127.0.0.1',
    port: 5433,
    database: 'cerveceria_usc',
    user: 'cerveceria_user',
    password: 'cerveceria_password',
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT id, sku, nombre, "createdAt" 
      FROM productos 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);

    console.log('\n✅ PRODUCTOS PERSISTIDOS EN LA BASE DE DATOS:');
    console.log('='.repeat(60));
    
    if (result.rows.length === 0) {
      console.log('⚠️  No hay productos en la base de datos');
    } else {
      result.rows.forEach((p, i) => {
        console.log(`${i + 1}. SKU: ${p.sku}`);
        console.log(`   Nombre: ${p.nombre}`);
        console.log(`   Creado: ${p.createdAt}`);
        console.log('');
      });
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPersistence();
