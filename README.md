# EvenUp — Session 1 (Data model + core ledger CRUD)

## Setup
```bash
npm install
node src/server.js
```
Server runs on http://localhost:3000. The SQLite DB file (`db/evenup.db`) is
created automatically on first run from `db/schema.sql`.

## Endpoints
- POST   /api/groups                        — create group
- GET    /api/groups                        — list groups
- GET    /api/groups/:id                    — group + members
- POST   /api/groups/:id/members            — add member ({user_id} or {name,email})
- POST   /api/groups/:groupId/expenses      — log expense (equal or custom split)
- GET    /api/groups/:groupId/expenses      — full ledger
- GET    /api/groups/:groupId/balances      — raw paid/owed/net per member

## Notes
- Uses better-sqlite3 (not Prisma) — this sandbox couldn't reach
  binaries.prisma.sh. Swap to Prisma later by translating db/schema.sql
  into schema.prisma (same tables/relations) and running `prisma migrate dev`
  on a machine with normal network access.
- Session 2 will add net "who-owes-whom" settlement math on top of
  the /balances endpoint (currently raw totals only).
