const express = require('express');
const db = require('../db');
const { calculateSettlements } = require('../utils/settlement');

const router = express.Router();

function roundToCents(n) {
  return Math.round(n * 100) / 100;
}

// GET /api/groups/:groupId/settlements
// Returns the minimal set of direct payments needed to settle the group up,
// computed from the same raw balances as /balances.
router.get('/:groupId/settlements', (req, res) => {
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
      net: roundToCents(paid - owed),
    };
  });

  const settlements = calculateSettlements(balances);

  res.json({
    group_id: groupId,
    settlements,
    transaction_count: settlements.length,
  });
});

module.exports = router;