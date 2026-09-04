import pool from './pool.js';

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    // Seed data will be added with domain tables in a later step.
    await client.query('COMMIT');
    console.log('Seed completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
