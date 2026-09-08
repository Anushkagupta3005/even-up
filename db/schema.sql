PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groups (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'INR',
  approval_mode INTEGER NOT NULL DEFAULT 0, -- 0 = off, 1 = on (majority vote required)
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Many-to-many: which users belong to which groups
CREATE TABLE IF NOT EXISTS group_members (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id  INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (group_id, user_id)
);

-- One expense = one payment event by one person, in one group
-- status: 'approved' expenses count toward balances/settlements.
-- 'pending' expenses are awaiting majority vote (only when group.approval_mode = 1).
-- 'rejected' expenses are excluded permanently.
CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id    INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by     INTEGER NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  amount      REAL NOT NULL CHECK (amount > 0),
  status      TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per participant's share of an expense.
-- Sum of shares for a given expense_id must equal that expense's amount
-- (enforced in application code in Session 1; DB-level trigger can come later).
CREATE TABLE IF NOT EXISTS splits (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_id   INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  share_amount REAL NOT NULL CHECK (share_amount >= 0),
  UNIQUE (expense_id, user_id)
);

-- One vote per member per pending expense. Majority approve -> expense.status = 'approved'.
-- Majority reject (mathematically settled) -> expense.status = 'rejected'.
CREATE TABLE IF NOT EXISTS expense_votes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote       TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (expense_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_splits_expense ON splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_splits_user ON splits(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_votes_expense ON expense_votes(expense_id);