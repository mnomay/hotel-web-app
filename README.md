# Hotel Web App

Public booking site and admin tool for a small hotel (**3 rooms**): Willow House.

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
| `HTL-PAST01` | Checked out + already reviewed |
| `HTL-DONE01` | Checked out, ready for a review |
| `HTL-NOW001` | Checked in (current stay) |
| `HTL-FUTR01` | Confirmed future stay |
| `HTL-CANC01` | Cancelled |

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
8. **Dinners** — today shows `HTL-NOW001` when seeded dinner is on  
9. **Reviews** — filter Latest / Good / Average / Bad; date filter includes `HTL-PAST01`

## Project structure

```
hotel-web-app/
├── backend/          # Express + Prisma + Postgres
│   ├── prisma/       # schema, migrations, seed
│   ├── src/
│   └── .env.example
├── frontend/         # React 18 + Tailwind
│   └── src/
└── README.md
```
