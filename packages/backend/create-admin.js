import pg from 'pg';

const pool = new pg.Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'cerveceria_usc',
  user: 'cerveceria_user',
  password: 'cerveceria_password',
});

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    // Create role
    await client.query(`
      INSERT INTO roles (id, name, permissions) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (id) DO NOTHING
    `, [
      'admin-role-id',
      'Administrador',
      JSON.stringify({
        users: ['create', 'read', 'update', 'delete'],
        products: ['create', 'read', 'update', 'delete'],
        inventory: ['create', 'read', 'update', 'delete'],
        sales: ['create', 'read', 'update', 'delete'],
        reports: ['read']
      })
    ]);
    console.log('✅ Role created');

    // Create admin user
    await client.query(`
      INSERT INTO users (id, email, password, "firstName", "lastName", "roleId", "isActive") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      ON CONFLICT (email) DO NOTHING
    `, [
      'admin-user-id',
      'admin@cerveceria-usc.edu.co',
      '$2a$10$kQx5ZYvXVr4qB2rGQh5Uve3r4YB9qYZ8ZPjCK7xG9zfVQ9YX6E5Cm',
      'Admin',
      'Principal',
      'admin-role-id',
      true
    ]);
    console.log('✅ Admin user created');

    // Verify
    const result = await client.query(
      'SELECT email, "firstName", "isActive" FROM users WHERE email = $1',
      ['admin@cerveceria-usc.edu.co']
    );
    console.log('✅ Verification:', result.rows[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
