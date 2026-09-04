import pg from 'pg';
import env from '../config/env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
});

export default pool;
