# 🧾 TripTab — shared trip expense tracker

A web app for groups of friends travelling together: a shared expense ledger,
a pooled "common fund", live multi-currency conversion, and a
who-owes-whom settlement calculator.

## Running it

```bash
cd "/Users/lingling/Documents/Claude/Projects/travel expense tracker"
npm run dev
```

Then open http://localhost:3000. The database is a local SQLite file
(`prisma/dev.db`) — no setup needed.

Demo accounts already exist from testing: `alice@test.com` and
`bob@test.com`, both with password `password123`. To start completely
fresh, delete `prisma/dev.db` and run `npx prisma migrate dev`.

## How it works

- **Trips** have a home currency (balances are shown in it) and a
  destination currency (the default when logging expenses).
- **Invites** are shareable links (Copy invite link on the trip page).
  Friends open the link, create an account, and they're in. Every member
  sees and can edit the same ledger.
- **Expenses** can be paid by a person (split among chosen members, with
  optional weights for uneven shares) or paid from the **common fund**,
  which draws down the pooled balance instead of creating a personal debt.
- **Exchange rates** come from open.er-api.com (free, no API key) and are
  cached in the database once per day. Original amounts are always stored
  and shown; conversions sit alongside them. If you get a free key from
  exchangerate-api.com, put it in `.env` as `EXCHANGE_RATE_API_KEY` and
  the app switches to the keyed endpoint automatically.
- **Balances**: net = personal expenses paid + fund contributions − fair
  share of all expenses. The settlement list is the minimum set of
  transfers (greedy largest-debtor/largest-creditor). Leftover fund money
  appears as a refund from the fund; an overdrawn fund as top-ups owed to it.
- **Activity log** records who added/edited/deleted what, and when.

## Tech notes

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (swap the datasource to Postgres later without model changes)
- Money stored as integer minor units (cents) — no floating-point drift
- Cookie sessions with scrypt password hashing (no external auth service)
- Settlement math is a pure, isolated module: `lib/settlement.ts`,
  tested in `lib/settlement.test.ts` (`npm test`)
