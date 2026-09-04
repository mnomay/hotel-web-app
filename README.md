# Hotel Web App

Public booking site and admin tool for a small hotel (3 rooms).

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Node.js 22, Express
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
npm run db:migrate
npm run db:seed
npm run dev
```

API runs at [http://localhost:3001](http://localhost:3001).  
Health check: [http://localhost:3001/api/health](http://localhost:3001/api/health).

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
├── backend/          # Express API + Postgres
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   └── routes/
│   └── .env.example
├── frontend/         # React 18 + Tailwind
│   └── src/
└── README.md
```

## Assumptions

Documented here as features are implemented. Initial setup only wires the apps and a Postgres connection; domain schema and business rules come next.
