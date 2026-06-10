require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'biomag_pro',
  user:     process.env.DB_USER     || 'appuser',
  password: process.env.DB_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado:', err.message);
});

module.exports = pool;
