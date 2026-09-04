# Hotel Web App

Public booking site and admin tool for a small hotel (3 rooms).

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Node.js 22, Express, **Prisma ORM**
- **Database:** PostgreSQL

## Prerequisites

- Node.js 22+ (`nvm use` if you have nvm)
- PostgreSQL running locally
- npm 10+

## Setup

### 1. Database

Create the database:

```bash
createdb hotel_web_app
```

Or with `psql`:

```bash
psql -U postgres -c "CREATE DATABASE hotel_web_app;"
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL if needed
npm install
npm run db:migrate:dev   # first time / local development (Prisma)
# or: npm run db:migrate  # apply existing migrations (CI / fresh machine)
npm run db:seed
npm run dev
```

API runs at [http://localhost:3001](http://localhost:3001).  
Health check: [http://localhost:3001/api/health](http://localhost:3001/api/health).

Prisma schema lives in `backend/prisma/schema.prisma`. Use `npm run db:studio` to browse data.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173).  
Vite proxies `/api` requests to the backend.

## Project structure

```
hotel-web-app/
├── backend/          # Express API + Prisma + Postgres
│   ├── prisma/       # schema, migrations, seed
│   ├── src/
│   │   ├── config/
│   │   ├── db/       # Prisma client
│   │   └── routes/
│   └── .env.example
├── frontend/         # React 18 + Tailwind
│   └── src/
└── README.md
```

## Assumptions

- Money is stored as **integer cents** (e.g. `8900` = **$89.00**). Display with a dollar sign; seed room prices are USD.
- Checkout date is exclusive (classic hotel-night model): a stay `2026-09-01` → `2026-09-03` is **2 nights**.
- Occupancy capacity counts `adults + children`; **infants do not count** toward max guests.
- Booking `price_per_night` / `total_price` are snapshots taken at booking time.
- Seeded admin accounts (password for both: `admin123`):
  - `admin@hotel.local`
  - `manager@hotel.local`
- Seeded confirmation codes for demos: `HTL-PAST01` (checked out), `HTL-NOW001` (checked in), `HTL-FUTR01` (confirmed), `HTL-CANC01` (cancelled).
- Booking statuses: `confirmed` → `checked_in` → `checked_out`, or `cancelled` before check-in. Guest cancel is only allowed while `confirmed`.

### Schema relationships

| From | To | Cardinality | Why |
|------|----|-------------|-----|
| room | bookings | 1∶N | Many stays per room over time |
| booking | dinner_plans | 1∶N | One dinner flag per night |
| booking | review | 1∶0..1 | At most one review per booking |
| admin_users | — | — | Auth only; no FK to bookings |
