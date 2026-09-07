-- EvenUp — Session 1 schema
-- Core ledger: groups, members, expenses, splits.
-- Balances are NOT stored here — they're computed from expenses+splits (Session 2).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groups (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'INR',
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
CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id    INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by     INTEGER NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  amount      REAL NOT NULL CHECK (amount > 0),
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

CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_splits_expense ON splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_splits_user ON splits(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
