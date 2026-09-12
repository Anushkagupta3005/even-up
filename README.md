
# EvenUp

**A real-time, collaborative group expense splitter — Splitwise, but live.**

Every group member sees balances, new expenses, and votes update instantly across all devices — no refresh needed.

🔗 **Live app:** [even-up-five.vercel.app](https://even-up-five.vercel.app)
(backend: `even-up.onrender.com` — first request may take ~30s to wake up on Render's free tier)

## Features

- **Live real-time sync** — balances, charts, and the expense feed update over WebSockets the instant anyone in the group makes a change
- **Vote-to-spend approval** — groups can require a majority vote before an expense is added; resolves automatically and updates everyone's screen live
- **Equal & custom splits** — split evenly or assign exact shares per person
- **Receipt scanning** — snap or upload a receipt, OCR (Tesseract.js) + an LLM (Groq) extract the items and total, and pre-fill the expense form
- **Settle Up** — graph-based debt simplification shows the minimum set of payments needed to settle the group
- **Spending Report** — per-person breakdown, 30-day spending trend, biggest expense, recent activity, all live-updating
- **Profile stats** — lifetime totals: groups joined, amount paid, expenses added, active settlements
- **Dark / light theme** — toggle in Profile, persisted across sessions
- **Responsive** — mobile-first UI with a dedicated 2-column desktop layout on Home

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Real-time | Socket.io (room-per-group broadcast) |
| Database | SQLite (`better-sqlite3`) |
| Auth | JWT + bcrypt |
| Receipt parsing | Tesseract.js (OCR) + Groq LLM (structuring) |

## Running it locally

**Backend**
```bash
npm install
node src/server.js
```
Runs on `http://localhost:3000`. The SQLite DB is created automatically on first run.

Create a `.env` in the project root:
```
JWT_SECRET=your_own_random_secret
PORT=3000
GROQ_API_KEY=your_groq_key   # optional — only needed for receipt scanning
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`. Make sure the backend is running first.

## Repo structure

```
├── src/            # Express backend (routes, db, socket logic)
├── frontend/        # React (Vite) frontend
└── db/schema.sql    # SQLite schema
```

## License

Personal portfolio project.
