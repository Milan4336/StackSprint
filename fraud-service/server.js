const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

const txHistory = new Map();

const pruneOld = (timestamps, now) => timestamps.filter((ts) => now - ts <= 60 * 1000);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fraud-service' });
});

app.post('/analyze', (req, res) => {
  const { accountId, amount } = req.body;

  if (!accountId || typeof amount !== 'number') {
    return res.status(400).json({ error: 'accountId (string) and amount (number) are required.' });
  }

  const now = Date.now();
  const timestamps = txHistory.get(accountId) || [];
  const recentTimestamps = pruneOld(timestamps, now);

  recentTimestamps.push(now);
  txHistory.set(accountId, recentTimestamps);

  const reasons = [];

  if (amount > 50000) {
    reasons.push('Amount exceeds 50000');
  }

  if (recentTimestamps.length > 5) {
    reasons.push('More than 5 transactions within 1 minute');
  }

  return res.json({
    accountId,
    isFraud: reasons.length > 0,
    reasons,
    totalTransactionsLastMinute: recentTimestamps.length
  });
});

app.listen(PORT, () => {
  console.log(`Fraud service running on port ${PORT}`);
});
