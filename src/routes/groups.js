const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/groups — create a group
router.post('/', (req, res) => {
  const { name, base_currency } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const stmt = db.prepare(
    'INSERT INTO groups (name, base_currency) VALUES (?, ?)'
  );
  const info = stmt.run(name.trim(), base_currency || 'INR');

  const group = db
    .prepare('SELECT * FROM groups WHERE id = ?')
    .get(info.lastInsertRowid);

  res.status(201).json(group);
});

// GET /api/groups — list all groups
router.get('/', (_req, res) => {
  const groups = db.prepare('SELECT * FROM groups ORDER BY created_at DESC').all();
  res.json(groups);
});

// GET /api/groups/:id — get one group with its members
router.get('/:id', (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });

  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email, gm.joined_at
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = ?
       ORDER BY gm.joined_at ASC`
    )
    .all(req.params.id);

  res.json({ ...group, members });
});

// POST /api/groups/:id/members — add a member to a group
// body: { user_id } OR { name, email } to create-and-add in one step
router.post('/:id/members', (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });

  let userId = req.body.user_id;

  if (!userId) {
    const { name, email } = req.body;
    if (!name || !email) {
      return res
        .status(400)
        .json({ error: 'provide user_id, or name + email to create a new user' });
    }
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      const info = db
        .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
        .run(name, email);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    }
    userId = user.id;
  } else {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'user not found' });
  }

  try {
    db.prepare(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)'
    ).run(req.params.id, userId);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'user is already a member of this group' });
    }
    throw err;
  }

  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email, gm.joined_at
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = ?
       ORDER BY gm.joined_at ASC`
    )
    .all(req.params.id);

  res.status(201).json({ group_id: Number(req.params.id), members });
});
// PATCH /api/groups/:id/approval-mode — toggle approval-mode on/off for a group
// body: { approval_mode: true | false }
router.patch('/:id/approval-mode', (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });

  const { approval_mode } = req.body;
  if (typeof approval_mode !== 'boolean') {
    return res.status(400).json({ error: 'approval_mode must be true or false' });
  }

  db.prepare('UPDATE groups SET approval_mode = ? WHERE id = ?').run(
    approval_mode ? 1 : 0,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  res.json(updated);
});
module.exports = router;
