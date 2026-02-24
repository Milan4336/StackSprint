import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ accountId: '', amount: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    const response = await fetch(`${API_BASE_URL}/transactions`);
    if (!response.ok) {
      throw new Error('Failed to load transactions');
    }
    const data = await response.json();
    setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions().catch((err) => setError(err.message));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        accountId: form.accountId,
        amount: Number(form.amount)
      };
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to create transaction');
      }

      setForm({ accountId: '', amount: '' });
      await fetchTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fraudAlerts = transactions.filter((tx) => tx.isFraud);

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', maxWidth: 960, margin: '2rem auto' }}>
      <h1>Fraud Detection Dashboard</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Create Transaction</h2>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            required
            placeholder="Account ID"
            value={form.accountId}
            onChange={(e) => setForm((prev) => ({ ...prev, accountId: e.target.value }))}
          />
          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Fraud Alerts ({fraudAlerts.length})</h2>
        {fraudAlerts.length === 0 ? (
          <p>No fraud alerts yet.</p>
        ) : (
          <ul>
            {fraudAlerts.map((tx) => (
              <li key={tx.id}>
                Transaction #{tx.id} ({tx.accountId}) - ${tx.amount} - {tx.fraudReasons.join(', ')}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Transactions ({transactions.length})</h2>
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Created At</th>
              <th>Fraud</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.accountId}</td>
                <td>${tx.amount}</td>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                <td>{tx.isFraud ? 'Yes' : 'No'}</td>
                <td>{tx.fraudReasons.join(', ') || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default App;
