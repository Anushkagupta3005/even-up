const express = require('express');
const db = require('../db');
const { getChartData } = require('./chart');

const router = express.Router();

function roundToCents(n) {
  return Math.round(n * 100) / 100;
}

// POST /api/groups/:groupId/expenses — add an expense with a split
// body: {
//   paid_by: userId,
//   description: "Dinner",
//   amount: 1200,
//   split_type: "equal" | "custom",
//   participants: [userId, ...]              // required for "equal"
//   splits: [{ user_id, share_amount }, ...]  // required for "custom"
// }
router.post('/:groupId/expenses', (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) return res.status(404).json({ error: 'group not found' });

  const { paid_by, description, amount, split_type } = req.body;

  if (!paid_by) return res.status(400).json({ error: 'paid_by is required' });
  if (!description || !description.trim())
    return res.status(400).json({ error: 'description is required' });
  if (typeof amount !== 'number' || amount <= 0)
    return res.status(400).json({ error: 'amount must be a positive number' });
  if (!['equal', 'custom'].includes(split_type))
    return res.status(400).json({ error: 'split_type must be "equal" or "custom"' });

  const memberIds = new Set(
    db
      .prepare('SELECT user_id FROM group_members WHERE group_id = ?')
      .all(groupId)
      .map((r) => r.user_id)
  );

  if (!memberIds.has(paid_by)) {
    return res.status(400).json({ error: 'paid_by must be a member of this group' });
  }

  // Resolve the split rows
  let splitRows

  if (split_type === 'equal') {
    const participants = req.body.participants;
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: 'participants array is required for equal split' });
    }
    for (const uid of participants) {
      if (!memberIds.has(uid)) {
        return res.status(400).json({ error: `user ${uid} is not a member of this group` });
      }
    }
    const share = roundToCents(amount / participants.length);
    splitRows = participants.map((uid, idx) => {
      // give any rounding remainder to the last participant so shares sum exactly
      const isLast = idx === participants.length - 1;
      const runningTotal = share * idx;
      const shareAmount = isLast ? roundToCents(amount - runningTotal) : share;
      return { user_id: uid, share_amount: shareAmount };
    });
  } else {
    const splits = req.body.splits;
    if (!Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ error: 'splits array is required for custom split' });
    }
    for (const s of splits) {
      if (!memberIds.has(s.user_id)) {
        return res.status(400).json({ error: `user ${s.user_id} is not a member of this group` });
      }
      if (typeof s.share_amount !== 'number' || s.share_amount < 0) {
        return res.status(400).json({ error: 'each split share_amount must be a non-negative number' });
      }
    }
    const sum = roundToCents(splits.reduce((acc, s) => acc + s.share_amount, 0));
    if (sum !== roundToCents(amount)) {
      return res
        .status(400)
        .json({ error: `splits must sum to amount: expected ${amount}, got ${sum}` });
    }
    splitRows = splits;
  }

  const groupMembers = db
    .prepare('SELECT user_id FROM group_members WHERE group_id = ?')
    .all(groupId);
  const totalMembers = groupMembers.length;
  const status = group.approval_mode ? 'pending' : 'approved';

  const insertExpense = db.prepare(
    'INSERT INTO expenses (group_id, paid_by, description, amount, status) VALUES (?, ?, ?, ?, ?)'
  );
  const insertSplit = db.prepare(
    'INSERT INTO splits (expense_id, user_id, share_amount) VALUES (?, ?, ?)'
  );

  const createExpense = db.transaction(() => {
    const info = insertExpense.run(groupId, paid_by, description.trim(), amount, status);
    const expenseId = info.lastInsertRowid;
    for (const row of splitRows) {
      insertSplit.run(expenseId, row.user_id, row.share_amount);
    }
    return expenseId;
  });

  const expenseId = createExpense();

  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
  const splits = db.prepare('SELECT * FROM splits WHERE expense_id = ?').all(expenseId);
  const io = req.app.get('io');

  if (status === 'pending') {
    io.to(`group:${groupId}`).emit('expense_pending', {
      ...expense,
      splits,
      votes_needed: Math.floor(totalMembers / 2) + 1,
      total_members: totalMembers,
    });
  } else {
    io.to(`group:${groupId}`).emit('expense_added', { ...expense, splits });
    io.to(`group:${groupId}`).emit('balances_updated', getChartData(groupId));
  }

  res.status(201).json({ ...expense, splits });
});

// GET /api/groups/:groupId/expenses — view the ledger (all expenses + splits)
router.get('/:groupId/expenses', (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) return res.status(404).json({ error: 'group not found' });

  const expenses = db
    .prepare('SELECT * FROM expenses WHERE group_id = ? ORDER BY created_at DESC')
    .all(groupId);

  const splitsStmt = db.prepare('SELECT * FROM splits WHERE expense_id = ?');
  const ledger = expenses.map((e) => ({ ...e, splits: splitsStmt.all(e.id) }));

  res.json(ledger);
});

// GET /api/groups/:groupId/expenses/:id — single expense detail
router.get('/:groupId/expenses/:id', (req, res) => {
  const expense = db
    .prepare('SELECT * FROM expenses WHERE id = ? AND group_id = ?')
    .get(req.params.id, req.params.groupId);
  if (!expense) return res.status(404).json({ error: 'expense not found' });

  const splits = db.prepare('SELECT * FROM splits WHERE expense_id = ?').all(expense.id);
  res.json({ ...expense, splits });
});


// POST /api/groups/:groupId/expenses/:id/vote — cast a vote on a pending expense
// body: { user_id, vote: "approve" | "reject" }
router.post('/:groupId/expenses/:id/vote', (req, res) => {
  const groupId = Number(req.params.groupId);
  const expenseId = Number(req.params.id);
  const { user_id, vote } = req.body;

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) return res.status(404).json({ error: 'group not found' });

  const expense = db
    .prepare('SELECT * FROM expenses WHERE id = ? AND group_id = ?')
    .get(expenseId, groupId);
  if (!expense) return res.status(404).json({ error: 'expense not found' });

  if (expense.status !== 'pending') {
    return res.status(409).json({ error: `expense is already ${expense.status}, voting is closed` });
  }

  if (!['approve', 'reject'].includes(vote)) {
    return res.status(400).json({ error: 'vote must be "approve" or "reject"' });
  }

  const isMember = db
    .prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?')
    .get(groupId, user_id);
  if (!isMember) return res.status(400).json({ error: 'user_id must be a member of this group' });

  try {
    db.prepare(
      'INSERT INTO expense_votes (expense_id, user_id, vote) VALUES (?, ?, ?)'
    ).run(expenseId, user_id, vote);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'user has already voted on this expense' });
    }
    throw err;
  }

  const totalMembers = db
    .prepare('SELECT COUNT(*) AS c FROM group_members WHERE group_id = ?')
    .get(groupId).c;
  const majorityThreshold = Math.floor(totalMembers / 2) + 1;

  const approveCount = db
    .prepare("SELECT COUNT(*) AS c FROM expense_votes WHERE expense_id = ? AND vote = 'approve'")
    .get(expenseId).c;
  const rejectCount = db
    .prepare("SELECT COUNT(*) AS c FROM expense_votes WHERE expense_id = ? AND vote = 'reject'")
    .get(expenseId).c;

  const io = req.app.get('io');
  let resolvedStatus = null;

  if (approveCount >= majorityThreshold) {
    resolvedStatus = 'approved';
  } else if (rejectCount > totalMembers - majorityThreshold) {
    resolvedStatus = 'rejected';
  }

  if (resolvedStatus) {
    db.prepare('UPDATE expenses SET status = ? WHERE id = ?').run(resolvedStatus, expenseId);
    const updatedExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
    const splits = db.prepare('SELECT * FROM splits WHERE expense_id = ?').all(expenseId);

    io.to(`group:${groupId}`).emit(
      resolvedStatus === 'approved' ? 'expense_approved' : 'expense_rejected',
      { ...updatedExpense, splits, approve_count: approveCount, reject_count: rejectCount }
    );

    if (resolvedStatus === 'approved') {
      io.to(`group:${groupId}`).emit('balances_updated', getChartData(groupId));
    }

    return res.json({ ...updatedExpense, splits, approve_count: approveCount, reject_count: rejectCount });
  }

  io.to(`group:${groupId}`).emit('expense_vote_cast', {
    expense_id: expenseId,
    approve_count: approveCount,
    reject_count: rejectCount,
    votes_needed: majorityThreshold,
    total_members: totalMembers,
  });

  res.json({ ...expense, approve_count: approveCount, reject_count: rejectCount, votes_needed: majorityThreshold });
});

module.exports = router;
