const express = require('express');
const db = require('../db');

const router = express.Router();

function roundToCents(n) {
  return Math.round(n * 100) / 100;
}

// GET /api/groups/:groupId/balances
// Session 1 scope: raw totals per member (how much they paid, how much they owe).
// Net "who-owes-whom" simplification is built in Session 2.
router.get('/:groupId/balances', (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) return res.status(404).json({ error: 'group not found' });

  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = ?`
    )
    .all(groupId);

  const paidStmt = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM expenses WHERE group_id = ? AND paid_by = ?`
  );
  const owedStmt = db.prepare(
    `SELECT COALESCE(SUM(s.share_amount), 0) AS total
     FROM splits s
     JOIN expenses e ON e.id = s.expense_id
     WHERE e.group_id = ? AND s.user_id = ?`
  );

  const balances = members.map((m) => {
    const paid = paidStmt.get(groupId, m.id).total;
    const owed = owedStmt.get(groupId, m.id).total;
    return {
      user_id: m.id,
      name: m.name,
      paid: roundToCents(paid),
      owed: roundToCents(owed),
      net: roundToCents(paid - owed), // positive = group owes them, negative = they owe group
    };
  });

  res.json(balances);
});

module.exports = router;
