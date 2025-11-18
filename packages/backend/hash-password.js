import bcrypt from 'bcryptjs';
import pg from 'pg';

const password = 'Admin123!';
const hash = await bcrypt.hash(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);

// Verificar
const isValid = await bcrypt.compare(password, hash);
console.log('Verificación:', isValid ? '✅ Válido' : '❌ Inválido');

// Actualizar en DB
const pool = new pg.Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'cerveceria_usc',
  user: 'cerveceria_user',
  password: 'cerveceria_password',
});

try {
  await pool.query(
    "UPDATE users SET password = $1 WHERE email = 'admin@cerveceria-usc.edu.co'",
    [hash]
  );
  console.log('✅ Password actualizado en DB');
  
  const result = await pool.query(
    "SELECT email, substring(password, 1, 20) as hash_preview FROM users WHERE email = 'admin@cerveceria-usc.edu.co'"
  );
  console.log('Verificación DB:', result.rows[0]);
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await pool.end();
}

