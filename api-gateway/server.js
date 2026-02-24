const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 4000;

const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || 'http://transaction-service:4001';
const FRAUD_SERVICE_URL = process.env.FRAUD_SERVICE_URL || 'http://fraud-service:4002';

app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.use(
  '/api/transactions',
  createProxyMiddleware({
    target: TRANSACTION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api': '' }
  })
);

app.use(
  '/api/fraud',
  createProxyMiddleware({
    target: FRAUD_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api': '' }
  })
);

app.listen(PORT, () => {
  console.log(`API gateway running on port ${PORT}`);
});
