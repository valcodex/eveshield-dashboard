# EveShield — Emergency Response Dashboard

A production-oriented emergency operations console for the EveShield organization. When a registered user activates the panic button in the EveShield mobile app, this dashboard surfaces the alert to authorized operators, police, and medical responders in real time — with victim details, live GPS tracking, a chronological event timeline, and response controls (assign, dispatch, escalate, resolve).

This is not a public-facing product: every route requires authentication and is scoped by role (Organization Administrator, Organization Operator, Police Officer, Medical Responder).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router, React Query, React Leaflet, Socket.IO client |
| Backend | Node.js, Express, TypeScript, Prisma ORM, Socket.IO |
| Database | PostgreSQL (Neon) |
| Auth | JWT (short-lived access token + httpOnly refresh cookie), bcrypt password hashing |
| Deployment | Frontend → Vercel, Backend → Render, DB → Neon |

## Repository structure

```
eveshield/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Data model (users, victims, emergencies, responders...)
│   │   └── seed.ts             # Demo users for each role
│   ├── src/
│   │   ├── config/             # env, Prisma client
│   │   ├── controllers/        # Route handlers (business logic)
│   │   ├── middleware/         # auth, RBAC, rate limiting, validation, error handling
│   │   ├── routes/             # Express routers
│   │   ├── services/           # Cross-cutting services (audit log)
│   │   ├── socket/             # Socket.IO server + broadcast helpers
│   │   ├── utils/               # JWT, AppError, id generators, asyncHandler
│   │   ├── app.ts              # Express app assembly
│   │   └── server.ts           # HTTP + Socket.IO bootstrap
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # AppShell, sidebar, notifications bell
│   │   │   ├── dashboard/      # Stats cards, filters, emergency feed
│   │   │   ├── victim/         # Victim profile card
│   │   │   └── emergency/      # Live map, timeline, response controls
│   │   ├── pages/               # LoginPage, DashboardPage
│   │   ├── lib/                 # API client (with silent token refresh), socket client
│   │   ├── store/                # AuthContext
│   │   └── types/                # Shared TS types mirroring the API
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml            # Local dev stack (Postgres + backend + frontend)
├── API_DOCS.md
└── DEPLOYMENT.md
```

---

## Getting started (local development)

### Prerequisites
- Node.js 20+
- A PostgreSQL database (local Docker container, or a free [Neon](https://neon.tech) project)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL to your Neon (or local) Postgres connection string,
# and set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET to long random strings.

npm install
npm run prisma:migrate      # creates tables from prisma/schema.prisma
npm run prisma:seed         # creates one demo user per role
npm run dev                 # starts the API on http://localhost:4000
```

Demo accounts created by the seed script (password for all: `ChangeMe123!`):

| Role | Email |
|---|---|
| Organization Administrator | admin@eveshield.org |
| Organization Operator | operator@eveshield.org |
| Police Officer | police@eveshield.org |
| Medical Responder | medic@eveshield.org |

**Change these credentials before any real deployment.**

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL defaults to http://localhost:4000/api

npm install
npm run dev                 # starts the dashboard on http://localhost:5173
```

### 3. Or run everything with Docker Compose

```bash
docker compose up --build
```

This brings up Postgres, the backend API, and the built frontend (served via Nginx) together. Run the Prisma migration/seed against the containerized backend once it's up:

```bash
docker compose exec backend npm run prisma:migrate:deploy
docker compose exec backend npm run prisma:seed
```

---

## Simulating a panic-button alert

The mobile app calls `POST /api/emergencies` when a user presses the panic button. To see the real-time flow end-to-end without the mobile app, log into the dashboard, then call the endpoint directly (see `API_DOCS.md` for the full payload) — the new alert appears in the Emergency Feed within a second via Socket.IO, no page refresh required.

---

## Security features implemented

- JWT auth with short-lived access tokens + httpOnly, `SameSite=Strict` refresh-token cookie
- bcrypt password hashing (cost factor 12)
- Role-Based Access Control on every mutating route
- `express-validator` input validation on all write endpoints
- `express-rate-limit` (global + a stricter limiter on `/api/auth/login`)
- Helmet security headers, scoped CORS, gzip compression
- Every sensitive action (login, assign responder, status/priority change, resolve) is written to an immutable `AuditLog` table
- All database access goes through Prisma's parameterized queries — no raw SQL string concatenation

## What's intentionally left as follow-up work

This scaffold implements the full architecture, data model, and the primary operator workflow end-to-end. Given the scope of the brief, a few pieces are stubbed for you to extend before a real production launch:

- Charts/analytics on the dashboard (Recharts is already a dependency — wire it to `GET /api/dashboard/stats` history)
- Push/SMS notification fan-out to responders' phones (the `Notification` model and Socket.IO broadcast are in place; add a provider like Twilio/FCM)
- File upload for victim profile photos (currently a plain URL field)
- Admin UI for managing users/responders (backend has the data model; add routes + a settings page)
- Automated tests (Jest/Vitest scaffolding is not included)
