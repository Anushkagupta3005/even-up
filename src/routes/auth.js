const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
// body: { name, email, password }
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (!email || !email.trim()) return res.status(400).json({ error: 'email is required' });
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (existing && existing.password_hash) {
    return res.status(409).json({ error: 'an account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let user;
  if (existing) {
    // user was previously added to a group by email (no password yet) — claim that account
    db.prepare('UPDATE users SET password_hash = ?, name = ? WHERE id = ?').run(
      passwordHash,
      name.trim(),
      existing.id
    );
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
  } else {
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name.trim(), email.trim(), passwordHash);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  }

  const token = signToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// POST /api/auth/login
// body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

module.exports = router;
