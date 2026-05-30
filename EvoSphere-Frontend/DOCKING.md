# EventSphere — Docked (Frontend ↔ Backend)

## Project Layout

```
eventsphere-backend/      ← Node/Express/Prisma API  (port 5000)
sphere-orchestra-main/    ← React/Vite frontend       (port 8080)
```

---

## Quick Start

### 1. Backend

```bash
cd eventsphere-backend
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev                   # starts on :5000
```

### 2. Frontend

```bash
cd sphere-orchestra-main
npm install
npm run dev                   # starts on :8080, proxies /api → :5000
```

Open **http://localhost:8080** — that's it.

---

## What was wired

| Area | Before | After |
|---|---|---|
| Auth (register/login/logout) | Mock redirect | Real JWT via `/api/auth` |
| Landing page | Hardcoded nav | Shows "Dashboard →" when logged in |
| Host Dashboard | Mock events array | `GET /api/events/my/events`, analytics, vendor app review, QR scan |
| Client Dashboard | Mock events + tickets | `GET /api/events`, `GET /api/orders/my` |
| Vendor Dashboard | Mock stalls | Profile update, apply to event, add products |
| Event Detail | Mock buy button | Real ticket purchase via `POST /api/orders` |
| EventCard | Mock shape only | Handles both backend shape (`id`, `name`) and legacy shape |
| CORS | `cors()` wildcard | Explicit `localhost:8080` + `FRONTEND_URL` env |
| Vite proxy | None | `/api/*` proxied to `:5000` in dev |

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL="mysql://USER:PASS@localhost:3306/eventsphere"
JWT_SECRET="your_secret_here"
JWT_EXPIRES_IN="7d"
PORT=5000
FRONTEND_URL="http://localhost:8080"
QR_SERVICE_URL="http://localhost:8080"
```

### Frontend `.env` (optional — proxy handles dev)
```
VITE_API_URL=http://localhost:5000
```
