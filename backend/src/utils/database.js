const { Pool } = require('pg');
require('dotenv').config();
const dbConfig = require('../config/database.config');

process.env.TZ = 'Asia/Jakarta';

const pool = new Pool(dbConfig);

if (process.env.NODE_ENV === 'development') {
  const dbUrl = process.env.DATABASE_URL || '';
  const sanitized = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log('Database connection:', sanitized);
}

pool.on('connect', async (client) => {
  await client.query("SET TIME ZONE 'Asia/Jakarta'");
  console.log('✅ Connected to PostgreSQL database (Timezone: Asia/Jakarta)');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err.message);
  process.exit(-1);
});

process.on('SIGINT', async () => {
  console.log('Closing database connection pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connection pool...');
  await pool.end();
  process.exit(0);
});

module.exports = pool;