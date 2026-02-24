const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'frauddb'
});

const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      account_id VARCHAR(100) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      is_fraud BOOLEAN NOT NULL DEFAULT FALSE,
      fraud_reasons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
    );
  `);
};

module.exports = {
  pool,
  init
};
