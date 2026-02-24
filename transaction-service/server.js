const express = require('express');
const cors = require('cors');
const { init, pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 4001;
const FRAUD_SERVICE_URL = process.env.FRAUD_SERVICE_URL || 'http://fraud-service:4002';

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'transaction-service' });
});

app.post('/transactions', async (req, res) => {
  try {
    const { accountId, amount } = req.body;

    if (!accountId || typeof amount !== 'number') {
      return res.status(400).json({ error: 'accountId (string) and amount (number) are required.' });
    }

    const fraudResponse = await fetch(`${FRAUD_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, amount })
    });

    if (!fraudResponse.ok) {
      return res.status(502).json({ error: 'Failed to analyze transaction for fraud.' });
    }

    const fraudAnalysis = await fraudResponse.json();

    const result = await pool.query(
      `INSERT INTO transactions (account_id, amount, is_fraud, fraud_reasons)
       VALUES ($1, $2, $3, $4)
       RETURNING id, account_id AS "accountId", amount::float8 AS amount, created_at AS "createdAt", is_fraud AS "isFraud", fraud_reasons AS "fraudReasons"`,
      [accountId, amount, fraudAnalysis.isFraud, fraudAnalysis.reasons]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/transactions', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, account_id AS "accountId", amount::float8 AS amount, created_at AS "createdAt", is_fraud AS "isFraud", fraud_reasons AS "fraudReasons"
       FROM transactions
       ORDER BY created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const start = async () => {
  try {
    await init();
    app.listen(PORT, () => {
      console.log(`Transaction service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize transaction-service:', err);
    process.exit(1);
  }
};

start();
