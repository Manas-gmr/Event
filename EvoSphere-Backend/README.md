# EventSphere Backend

Node.js + Express + Prisma backend for the EventSphere event management platform.

## Stack
- **Runtime**: Node.js (CommonJS)
- **Framework**: Express 5
- **ORM**: Prisma 5 on MySQL
- **Auth**: JWT + bcryptjs
- **QR**: Java ZXing microservice (separate service)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Edit `.env`:
```
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/eventsphere"
JWT_SECRET="your_secret_here"
JWT_EXPIRES_IN="7d"
PORT=5000
QR_SERVICE_URL="http://localhost:8080"
```

### 3. Run Prisma migrations (DB already set up)
```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

---

## Project Structure

```
eventsphere-backend/
├── server.js                     ← entry point
├── prisma/
│   ├── schema.prisma             ← DB models
│   └── migrations/               ← SQL migrations
└── src/
    ├── app.js                    ← Express app
    ├── lib/
    │   └── prisma.js             ← Prisma client singleton
    ├── middleware/
    │   ├── authenticate.js       ← JWT verification
    │   ├── authorize.js          ← Role guard
    │   └── validate.js           ← express-validator error handler
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── event.controller.js
    │   ├── order.controller.js
    │   ├── ticket.controller.js
    │   └── vendor.controller.js
    └── routes/
        ├── auth.routes.js
        ├── event.routes.js
        ├── order.routes.js
        ├── ticket.routes.js
        └── vendor.routes.js
```

---

## Roles

| Role   | Description |
|--------|-------------|
| HOST   | Creates and manages events, ticket types, approves vendors, scans QR |
| CLIENT | Browses events, buys tickets, views own orders |
| VENDOR | Creates vendor profile, applies to events, lists products |

---

## API Reference

All protected routes require:
```
Authorization: Bearer <token>
```

---

### Auth  `/api/auth`

| Method | Endpoint       | Auth | Description |
|--------|---------------|------|-------------|
| POST   | `/register`   | ❌   | Register (HOST / CLIENT / VENDOR) |
| POST   | `/login`      | ❌   | Login, returns JWT |
| GET    | `/me`         | ✅   | Current user info |

**Register HOST/CLIENT:**
```json
{ "name": "Manas", "email": "m@x.com", "password": "secret123", "role": "HOST" }
```

**Register VENDOR (extra fields):**
```json
{
  "name": "Sneha", "email": "s@x.com", "password": "secret123", "role": "VENDOR",
  "businessName": "Sneha Crafts", "category": "Handicrafts", "bio": "Handmade goods"
}
```

---

### Events  `/api/events`

| Method | Endpoint                   | Auth  | Role   | Description |
|--------|---------------------------|-------|--------|-------------|
| GET    | `/`                        | ❌    | —      | List published events (paginated) |
| GET    | `/:id`                     | ❌    | —      | Single event with ticket types & vendors |
| GET    | `/my/events`               | ✅    | HOST   | Host's own events |
| POST   | `/`                        | ✅    | HOST   | Create event |
| PATCH  | `/:id`                     | ✅    | HOST   | Update event |
| DELETE | `/:id`                     | ✅    | HOST   | Delete event |
| POST   | `/:id/ticket-types`        | ✅    | HOST   | Add ticket tier to event |
| GET    | `/:id/analytics`           | ✅    | HOST   | Revenue & attendance stats |

**Create event body:**
```json
{
  "name": "TechFest 2026",
  "venue": "Delhi Convention Centre",
  "eventDate": "2026-08-15T10:00:00Z",
  "capacity": 500,
  "description": "Annual tech fest",
  "bannerUrl": "https://..."
}
```

**Update event status (publish it):**
```json
{ "status": "PUBLISHED" }
```
Status flow: `DRAFT → PUBLISHED → ONGOING → COMPLETED / CANCELLED`

**Add ticket type:**
```json
{ "label": "General", "price": 299, "totalQuantity": 300, "saleEndsAt": "2026-08-14T23:59:59Z" }
```

---

### Orders  `/api/orders`

| Method | Endpoint  | Auth | Role   | Description |
|--------|----------|------|--------|-------------|
| POST   | `/`       | ✅   | CLIENT | Buy tickets |
| GET    | `/my`     | ✅   | CLIENT | Own order history |
| GET    | `/:id`    | ✅   | CLIENT | Single order with tickets |

**Buy tickets:**
```json
{ "ticketTypeId": 1, "quantity": 2 }
```

Response includes individual `tickets[]` — each has a `qrCodeData` UUID.
Pass each `qrCodeData` to your Java ZXing service to generate the QR image.

---

### Tickets  `/api/tickets`

| Method | Endpoint              | Auth | Role   | Description |
|--------|-----------------------|------|--------|-------------|
| POST   | `/validate`           | ✅   | HOST   | Scan & validate QR at entry |
| GET    | `/event/:eventId`     | ✅   | HOST   | All tickets for host's event |
| GET    | `/:id`                | ✅   | CLIENT | Own ticket by ID |

**Validate QR (scan at gate):**
```json
{ "qrCodeData": "550e8400-e29b-41d4-a716-446655440000" }
```
- Returns `400` if already used or expired
- Returns `200` with entry granted message if valid
- Sets `status = USED` and records `usedAt`

---

### Vendors  `/api/vendors`

| Method | Endpoint                              | Auth | Role   | Description |
|--------|--------------------------------------|------|--------|-------------|
| GET    | `/profile`                            | ✅   | VENDOR | Own vendor profile |
| PATCH  | `/profile`                            | ✅   | VENDOR | Update profile |
| POST   | `/apply/:eventId`                     | ✅   | VENDOR | Apply to an event |
| GET    | `/applications/my`                    | ✅   | VENDOR | Own applications |
| POST   | `/products`                           | ✅   | VENDOR | Add product (must be approved) |
| PATCH  | `/products/:productId`                | ✅   | VENDOR | Update product |
| DELETE | `/products/:productId`                | ✅   | VENDOR | Delete product |
| GET    | `/applications/event/:eventId`        | ✅   | HOST   | View vendor applications |
| PATCH  | `/applications/:applicationId`        | ✅   | HOST   | Approve/reject vendor |
| GET    | `/products/event/:eventId`            | ❌   | —      | Public: vendor products at event |

**Apply to event:**
```json
{ "message": "We sell handmade jewelry and would love to showcase at your fest!" }
```

**Approve/reject vendor:**
```json
{ "status": "APPROVED" }
```

**Add product (must be APPROVED vendor for that event):**
```json
{
  "eventId": 1,
  "name": "Silver Bracelet",
  "description": "Handcrafted 925 silver",
  "price": 499,
  "imageUrl": "https://..."
}
```

---

## QR Flow (Integration with Java ZXing)

1. Client buys tickets → each ticket gets a `qrCodeData` UUID in the DB
2. Your frontend calls Java service: `POST http://localhost:8080/generate` with `{ token: qrCodeData }`
3. Java returns QR image → show to client
4. At event gate, host's app scans QR → calls `POST /api/tickets/validate` with `{ qrCodeData }`
5. Backend validates, marks `USED`, returns confirmation

---

## Error Responses

```json
{ "message": "Error description" }
{ "errors": [{ "msg": "Validation error", "path": "email" }] }
```

| Code | Meaning |
|------|---------|
| 400  | Bad request / business logic failure |
| 401  | Missing or invalid JWT |
| 403  | Forbidden (wrong role or not owner) |
| 404  | Resource not found |
| 409  | Conflict (duplicate email, duplicate application) |
| 422  | Validation errors |
| 500  | Internal server error |
