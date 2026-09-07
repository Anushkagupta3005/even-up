const express = require('express');
const db = require('../db');

const router = express.Router();

function roundToCents(n) {
  return Math.round(n * 100) / 100;
}

// Shared helper so both the REST route and the WebSocket broadcaster
// (called from expenses.js after an approval) can compute the same shape.
function getChartData(groupId) {
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

  const netBalances = [];
  const spendingByPerson = [];
  let totalGroupSpend = 0;

  for (const m of members) {
    const paid = roundToCents(paidStmt.get(groupId, m.id).total);
    const owed = roundToCents(owedStmt.get(groupId, m.id).total);
    netBalances.push({ user_id: m.id, name: m.name, net: roundToCents(paid - owed) });
    spendingByPerson.push({ user_id: m.id, name: m.name, paid });
    totalGroupSpend += paid;
  }

  return {
    net_balances: netBalances,
    spending_by_person: spendingByPerson,
    total_group_spend: roundToCents(totalGroupSpend),
  };
}

// GET /api/groups/:groupId/chart-data
router.get('/:groupId/chart-data', (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) return res.status(404).json({ error: 'group not found' });

  res.json(getChartData(groupId));
});

module.exports = router;
module.exports.getChartData = getChartData;
