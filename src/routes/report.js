const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function roundToCents(n) {
  return Math.round(n * 100) / 100;
}

// GET /api/groups/:groupId/report-data
// Returns aggregated spending insights for the active group + logged-in user.
router.get('/:groupId/report-data', requireAuth, (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = req.user.id;

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) return res.status(404).json({ error: 'group not found' });

  // --- 1. Spending by person (approved only) ---
  const members = db
    .prepare(
      `SELECT u.id, u.name
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = ?`
    )
    .all(groupId);

  const paidStmt = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM expenses WHERE group_id = ? AND paid_by = ? AND status = 'approved'`
  );
  const owedStmt = db.prepare(
    `SELECT COALESCE(SUM(s.share_amount), 0) AS total
     FROM splits s
     JOIN expenses e ON e.id = s.expense_id
     WHERE e.group_id = ? AND s.user_id = ? AND e.status = 'approved'`
  );

  const spendingByPerson = [];
  let totalGroupSpend = 0;
  let youPaid = 0;
  let youOwe = 0;

  for (const m of members) {
    const paid = roundToCents(paidStmt.get(groupId, m.id).total);
    const owed = roundToCents(owedStmt.get(groupId, m.id).total);
    spendingByPerson.push({ user_id: m.id, name: m.name, paid, owed });
    totalGroupSpend += paid;
    if (m.id === userId) {
      youPaid = paid;
      youOwe = owed;
    }
  }

  // --- 2. Spending over time (approved, last 30 days, grouped by date) ---
  const dailySpend = db
    .prepare(
      `SELECT date(created_at) AS day, SUM(amount) AS total
       FROM expenses
       WHERE group_id = ? AND status = 'approved'
         AND created_at >= datetime('now', '-30 days')
       GROUP BY date(created_at)
       ORDER BY day ASC`
    )
    .all(groupId)
    .map((r) => ({ day: r.day, total: roundToCents(r.total) }));

  // --- 3. Recent expenses (last 10 approved) ---
  const recentExpenses = db
    .prepare(
      `SELECT e.id, e.description, e.amount, e.created_at, u.name AS paid_by_name
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       WHERE e.group_id = ? AND e.status = 'approved'
       ORDER BY e.created_at DESC
       LIMIT 10`
    )
    .all(groupId);

  // --- 4. Top expense ---
  const topExpense = db
    .prepare(
      `SELECT e.description, e.amount, u.name AS paid_by_name
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       WHERE e.group_id = ? AND e.status = 'approved'
       ORDER BY e.amount DESC
       LIMIT 1`
    )
    .get(groupId) || null;

  // --- 5. Expense count ---
  const expenseCount = db
    .prepare(
      `SELECT COUNT(*) AS c FROM expenses WHERE group_id = ? AND status = 'approved'`
    )
    .get(groupId).c;

  res.json({
    group_name: group.name,
    total_group_spend: roundToCents(totalGroupSpend),
    expense_count: expenseCount,
    spending_by_person: spendingByPerson,
    daily_spend: dailySpend,
    recent_expenses: recentExpenses,
    top_expense: topExpense,
    you: { paid: youPaid, owed: youOwe, net: roundToCents(youPaid - youOwe) },
  });
});

module.exports = router;