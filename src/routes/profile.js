const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { calculateSettlements } = require('../utils/settlement');

const router = express.Router();

function roundToCents(n) {
  return Math.round(n * 100) / 100;
}

// GET /api/profile/stats
// Returns aggregated lifetime stats for the logged-in user.
router.get('/stats', requireAuth, (req, res) => {
  const userId = req.user.id;

  // ── 1. Groups joined ──
  const groupCount = db
    .prepare('SELECT COUNT(*) AS c FROM group_members WHERE user_id = ?')
    .get(userId).c;

  // ── 2. Total you've paid (approved expenses, across all groups) ──
  const totalPaid = roundToCents(
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses WHERE paid_by = ? AND status = 'approved'`
      )
      .get(userId).total
  );

  // ── 3. Pending approvals (expenses awaiting your vote across all groups) ──
  const pendingApprovals = db
    .prepare(
      `SELECT COUNT(DISTINCT e.id) AS c
       FROM expenses e
       JOIN group_members gm ON gm.group_id = e.group_id AND gm.user_id = ?
       LEFT JOIN expense_votes ev ON ev.expense_id = e.id AND ev.user_id = ?
       WHERE e.status = 'pending' AND ev.id IS NULL`
    )
    .get(userId, userId).c;

  // ── 4. Total settled (count of settlement arrows involving you, across all groups) ──
  const userGroups = db
    .prepare('SELECT group_id FROM group_members WHERE user_id = ?')
    .all(userId)
    .map((r) => r.group_id);

  let totalSettled = 0;
  for (const gid of userGroups) {
    const members = db
      .prepare(
        `SELECT u.id, u.name
         FROM group_members gm
         JOIN users u ON u.id = gm.user_id
         WHERE gm.group_id = ?`
      )
      .all(gid);

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

    const balances = members.map((m) => {
      const paid = paidStmt.get(gid, m.id).total;
      const owed = owedStmt.get(gid, m.id).total;
      return { user_id: m.id, name: m.name, net: roundToCents(paid - owed) };
    });

    const settlements = calculateSettlements(balances);
    for (const s of settlements) {
      if (s.from_user_id === userId || s.to_user_id === userId) {
        totalSettled++;
      }
    }
  }

  // ── 5. Member since ──
  const user = db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId);

  // ── 6. Expenses added (approved, across all groups) ──
  const expensesAdded = db
    .prepare(
      `SELECT COUNT(*) AS c FROM expenses WHERE paid_by = ? AND status = 'approved'`
    )
    .get(userId).c;

  res.json({
    groups_joined: groupCount,
    total_paid: totalPaid,
    pending_approvals: pendingApprovals,
    total_settled: totalSettled,
    expenses_added: expensesAdded,
    member_since: user?.created_at || null,
  });
});

module.exports = router;