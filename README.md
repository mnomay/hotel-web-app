# Hotel Web App

Public booking site and admin tool for a small hotel (**3 rooms**): Willow Hotel.

Guests can book, manage dinners/cancel, and leave a review — no account required.  
Staff use a cookie-authenticated admin area for occupancy, dinners, reviews, and check-in/out.

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Node.js 22, Express, **Prisma ORM**
- **Database:** PostgreSQL

## Prerequisites

- Node.js 22+ (`nvm use 22` if you use nvm)
- PostgreSQL running locally
- npm 10+

## Setup

### 1. Database

```bash
createdb hotel_web_app
```

Or:

```bash
psql -U postgres -c "CREATE DATABASE hotel_web_app;"
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL if needed
npm install
npm run db:migrate     # apply migrations
npm run db:seed
npm run dev
```

API: [http://localhost:3001](http://localhost:3001)  
Health: [http://localhost:3001/api/health](http://localhost:3001/api/health)

For local schema iteration you can use `npm run db:migrate:dev` instead of `db:migrate`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173) (Vite proxies `/api` → backend)

## Seed credentials & demo bookings

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hotel.local` | `admin123` |

| Code | Use |
|------|-----|
| `HTL-GOOD01` / `HTL-GOOD02` / `HTL-PAST01` | Checked out + **good** reviews (5 / 4.5 / 4) |
| `HTL-AVG001` / `HTL-AVG002` | Checked out + **average** reviews (3 / 2.5) |
| `HTL-BAD001` / `HTL-BAD002` | Checked out + **bad** reviews (1.5 / 0.5) |
| `HTL-DONE01` | Checked out, ready for a review (no review yet) |
| `HTL-NOW001` | Checked in Courtyard (Sep 3–6); dinner today & tomorrow |
| `HTL-GARD06` | Confirmed Garden (Sep 6–8) |
| `HTL-ROOF08` | Confirmed Rooftop (Sep 8–11, nights through Sep 10) |
| `HTL-FUTR01` | Confirmed future stay (mid-Sept) |
| `HTL-CANC01` | Cancelled (does not block availability) |

Seed dates are anchored to **2026-09-04**. From today through ~Sep 10 only **one** room is occupied at a time, so **≥2 rooms stay free** for booking tests. Past stays cover all three rooms with dinner plans and the review bands above.

## Public routes

| Path | Purpose |
|------|---------|
| `/` | Search availability & create booking |
| `/manage` | Look up by confirmation code; dinners + cancel |
| `/review` | Leave a review after checkout date |

## Admin routes

| Path | Purpose |
|------|---------|
| `/admin/login` | Sign in (JWT in httpOnly cookie) |
| `/admin` | Rooms × days overview grid |
| `/admin/bookings/:code` | Detail, cancel, check-in / check-out |
| `/admin/dinners` | Dinner headcounts today & tomorrow |
| `/admin/reviews` | Reviews with sort + date filters |
| `/admin/settings` | View email; change password |

## Assumptions

- Money is stored as **integer cents** (e.g. `8900` = **$89.00**). Display with `$`.
- Checkout date is **exclusive** (hotel nights): `2026-09-01` → `2026-09-03` = **2 nights**.
- Capacity counts `adults + children`; **infants do not count** toward max guests.
- `price_per_night` / `total_price` are **snapshots** at booking time.
- Admin JWT lives in httpOnly cookie `hotel_admin_token`; frontend uses `credentials: 'include'`.
- While an admin session is active, public guest routes (`/`, `/manage`, `/review`) redirect to `/admin`.
- Guest cancel only while status is `confirmed`.
- Status flow: `confirmed` → `checked_in` → `checked_out`, or `cancelled` before check-in.
- Only **admins** mark check-in / check-out; actual dates: `checked_in_at` / `checked_out_at` (date-only). Planned stay: `check_in` / `check_out`.
- Dinner headcount = **adults + children** on active bookings (`confirmed` / `checked_in`) with dinner that night.
- Reviews: one per booking; only after planned checkout date; rating **0.5–5** in half-star steps. Admin bands: **good** ≥4, **average** 2–&lt;4, **bad** &lt;2.
- Occupancy (availability + overview “active”) uses statuses `confirmed` and `checked_in`.

### Schema relationships

| From | To | Cardinality |
|------|----|-------------|
| room | bookings | 1∶N |
| booking | dinner_plans | 1∶N |
| booking | review | 1∶0..1 |
| admin_users | — | auth only |

## Smoke checklist

1. **Book** — search dates → pick a room → complete booking → note confirmation code  
2. **Manage** — look up code → toggle dinners → save  
3. **Cancel** — cancel a `confirmed` booking; room frees on availability/overview  
4. **Review** — submit for `HTL-DONE01`; reject before checkout / second review  
5. **Admin login** — `admin@hotel.local` / `admin123`  
6. **Overview** — see seeded bars; open a booking  
7. **Check-in / out** — mark with date (defaults today)  
8. **Dinners** — today & tomorrow include `HTL-NOW001` headcount  
9. **Reviews** — filter Latest / Good / Average / Bad (seed has all three bands)  
10. **Settings** — view email; change password (then seed again if you want `admin123` back)

## Fresh install (verify from a clean machine)

```bash
# Prerequisites: Node 22+, PostgreSQL, npm 10+
git clone <repo-url> hotel-web-app && cd hotel-web-app
# or unzip the submission archive and cd into it

createdb hotel_web_app   # skip if the DB already exists

cd backend
cp .env.example .env     # adjust DATABASE_URL if needed
npm install
npm run db:migrate
npm run db:seed
npm run dev              # http://localhost:3001

# new terminal
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Confirm health at `http://localhost:3001/api/health`, then run through the smoke checklist above.

## Package for submission (no `node_modules`)

From the project root (parent of `backend/` and `frontend/`):

```bash
# macOS / Linux — zip without dependencies, secrets, or git metadata
cd ..
zip -r hotel-web-app-submission.zip hotel-web-app \
  -x "hotel-web-app/**/node_modules/*" \
  -x "hotel-web-app/**/dist/*" \
  -x "hotel-web-app/**/.env" \
  -x "hotel-web-app/**/.env.local" \
  -x "hotel-web-app/.git/*" \
  -x "hotel-web-app/**/.DS_Store"

# Optional: confirm the archive is clean (keeps backend/.env.example)
unzip -l hotel-web-app-submission.zip | grep -E 'node_modules|/\.env$' || echo "OK: no node_modules or .env secrets in zip"
unzip -l hotel-web-app-submission.zip | grep '\.env.example' || echo "WARN: missing .env.example"
```

Include `README.md`, `backend/.env.example`, Prisma migrations, and lockfiles. Receivers run the **Fresh install** steps above.

## Future enhancements

Ideas beyond the current delivery — not implemented yet:

- **Payment integration** — collect deposits or full stay payment at booking time (card checkout), and record payment status on the booking.
- **Refund flow** — when a booking is cancelled, calculate and process refunds (full or partial) according to simple cancellation rules.
- **Email notifications** — send transactional email on key events (booking confirmed, cancelled, check-in reminder, review invitation).
- **Email verification before confirmation** — require the guest to verify their email (e.g. magic link or code) before the booking is fully confirmed.
- **Room CRUD + image gallery** — admin UI to create/update/delete rooms and manage a gallery of photos per room (instead of static local images).
- **Forgot password** — let admins reset their password via email link when they cannot sign in.
- **Reporting / exports** — admin reports for occupancy, revenue, and dinner counts, with CSV/PDF export.
- **Audit log** — record who performed sensitive admin actions (cancel, check-in/out, password change, dinner edits) with timestamps.

## Project structure

```
hotel-web-app/
├── backend/          # Express + Prisma + Postgres
│   ├── prisma/       # schema, migrations, seed
│   ├── src/
│   └── .env.example
├── frontend/         # React 18 + Tailwind
│   └── src/
├── .gitignore
├── .nvmrc            # Node 22
└── README.md
```
