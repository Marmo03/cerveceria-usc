import pg from 'pg';

const pool = new pg.Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'cerveceria_usc',
  user: 'cerveceria_user',
  password: 'cerveceria_password',
  max: 20,
});

export default pool;
