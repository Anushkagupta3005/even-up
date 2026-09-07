const express = require('express');
const groupsRouter = require('./routes/groups');
const expensesRouter = require('./routes/expenses');
const balancesRouter = require('./routes/balances');

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/groups', groupsRouter);
app.use('/api/groups', expensesRouter);
app.use('/api/groups', balancesRouter);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'not found' }));

// error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

module.exports = app;
