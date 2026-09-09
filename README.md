# EvenUp

**A real-time, collaborative group expense splitter with a built-in vote-to-spend workflow.**

Think Splitwise, but live — every group member sees balances, new expenses, and approval votes update instantly across all connected devices, no refresh required. Before a proposed expense hits the shared ledger, the group can vote on it in real time.

## Why this is different from a typical expense splitter

Most expense-splitting apps (including Splitwise) are request/response: you add an expense, reload, and see the update. EvenUp is built around two things most clones skip entirely:

- **Live collaborative sync.** Balances, the spending donut chart, and the expense feed update over WebSockets the instant any group member makes a change — verified across two separate browser sessions acting as different users in real time.
- **Vote-to-spend approval.** Any group can opt into requiring a majority vote before a proposed expense is added to the ledger. Members see a live "needs your approval" queue and vote Approve/Reject; the expense resolves automatically once a majority is reached, and everyone's screen updates immediately.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Real-time | Socket.io (room-per-group broadcast model) |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` password hashing |

## Architecture at a glance

```
Client (React)
  │
  ├─ REST (fetch) ──► Express API ──► SQLite
  │                        │
  └─ WebSocket ◄───────────┘
     (Socket.io room: group:<id>)
```

Every group has its own Socket.io room. When any member creates, approves, rejects, or votes on an expense, the server recomputes balances and broadcasts the update to that room — every connected client for that group re-renders live, without polling.

## Key design decisions

A few choices worth calling out, since the reasoning is often more interesting than the code:

- **Voting resolves early, not just at unanimity.** An expense resolves to `approved` the moment a majority is reached, and to `rejected` the moment majority approval becomes *mathematically impossible* — rather than waiting for every member to vote. This avoids an expense getting stuck forever if one member never responds. One consequence: in a 2-person group, a single reject vote is enough to end the vote, since with only one vote left to cast, majority approval can no longer be reached. The UI surfaces this directly ("Needs 2/2 to approve, 1/2 to reject") rather than hiding the asymmetry.
- **Authentication drives who can act, not client-supplied IDs.** Early in the build, routes like "add an expense" trusted a `paid_by` field sent in the request body — meaning anyone could claim to be any user. Once JWT auth was added, every action-taking route was switched to derive the acting user from the verified token (`req.user.id`) instead, closing that gap.
- **Settlement uses greedy debtor-creditor matching**, not a full graph-minimization algorithm — it produces a valid, non-redundant set of settling payments efficiently, trading a small amount of optimality for simplicity. (Full graph-based debt simplification, which collapses transitive chains like A→B→C into fewer direct payments, is planned as a follow-up.)
- **SQLite over Postgres/Prisma for now.** The original plan called for Prisma + Postgres; Prisma's binary download was blocked in the original dev sandbox, so the project shipped on `better-sqlite3` with an equivalent schema. The schema (`db/schema.sql`) is written to translate cleanly to Prisma later if needed.

## Getting started

### Backend

```bash
npm install
node src/server.js
```

Runs on `http://localhost:3000`. The SQLite database (`db/evenup.db`) is created automatically on first run from `db/schema.sql`.

Create a `.env` file in the project root with:

```
JWT_SECRET=your_own_random_secret_here
PORT=3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. Make sure the backend is running first — the frontend expects it at `http://localhost:3000`.

## API overview

**Auth**
- `POST /api/auth/register` — create an account (or claim an invite-only account created via the members endpoint)
- `POST /api/auth/login` — returns a JWT

**Groups**
- `POST /api/groups` — create a group
- `GET /api/groups/mine` — groups the logged-in user belongs to
- `GET /api/groups/:id` — group details + members
- `POST /api/groups/:id/members` — add a member (`{ user_id }` or `{ name, email }` to invite)
- `PATCH /api/groups/:id/approval-mode` — toggle vote-to-spend on/off for the group

**Expenses & voting**
- `POST /api/groups/:groupId/expenses` — log an expense (equal or custom split); inserted as `pending` if approval mode is on, `approved` otherwise
- `GET /api/groups/:groupId/expenses` — full ledger
- `POST /api/groups/:groupId/expenses/:id/vote` — cast an approve/reject vote on a pending expense

**Balances & settlement**
- `GET /api/groups/:groupId/balances` — raw paid/owed/net per member
- `GET /api/groups/:groupId/settlements` — minimal set of payments to settle the group
- `GET /api/groups/:groupId/chart-data` — net balances + spending breakdown, shaped for the live donut chart

All expense/voting/member-management routes require a valid `Authorization: Bearer <token>` header.

## What's next

The core app (auth, real-time ledger, vote-to-spend approval) is complete and deployed. Planned follow-ups, in priority order:

1. **Receipt OCR + LLM structuring** — scan a receipt, extract line items automatically
2. **Graph-based debt simplification** — collapse multi-hop debt chains into the minimum number of payments
3. Export/share a settlement summary, spending insights, multi-currency support

## License

Personal portfolio project.
