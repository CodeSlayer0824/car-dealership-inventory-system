# Car Dealership Inventory System

A full-stack dealership inventory app with a TypeScript/Express REST API, persistent SQLite storage, and a responsive React, Vite, and Tailwind CSS frontend.

## Features

- Customer registration and login with bcrypt password hashing and JWT bearer authentication.
- Role-based API controls: authenticated users can create and update vehicles; admins can additionally delete and restock.
- Search by make, model, category, and inclusive minimum/maximum price.
- Atomic purchases that cannot reduce stock below zero; purchases of out-of-stock vehicles return a conflict.
- Responsive inventory cards, search filters, vehicle forms, and visible loading and error states.

## Architecture

```text
backend/
  src/
    app.ts                       Express app composition
    server.ts                    Environment validation and HTTP lifecycle
    db/                          SQLite, numbered SQL migrations, admin seed
    middleware/                  Authentication, roles, and error handling
    modules/auth/                Registration, login, password and JWT services
    modules/vehicles/            Search, vehicle management, stock operations
  tests/                         API integration and migration tests
frontend/
  src/
    components/                  Layout, route guards, status messages
    features/auth/               Auth state, login and registration pages
    features/vehicles/           Inventory page, cards, filters, forms, API
    lib/                         API client and session persistence
    styles/                      Tailwind theme and application styles
```

## Requirements

- Node.js 20.19+ (or 22.12+); the project was verified with Node.js 24.
- npm 10+.

## Run locally on Windows

From the repository root in PowerShell:

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` before first use:

- Replace `JWT_SECRET` with a private random value of at least 32 characters. To generate one with Node:
  `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
- Set `ADMIN_PASSWORD` to a secure password with at least 12 characters.
- Optionally change `ADMIN_NAME`, `ADMIN_EMAIL`, or `PORT`.

Create the local admin account and start both applications:

```powershell
npm run seed:admin -w backend
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`) and sign in with the admin credentials in `.env`. The API listens on `http://localhost:3000`; `GET /api/health` is an unauthenticated health check.

The default database is persistent at `backend/data/inventory.sqlite`. Its parent folder is created automatically. The initial numbered migration and default roles are applied at startup. Tests use isolated in-memory SQLite databases.

To stop the development servers, press `Ctrl+C` in the terminal. Keep `.env` and the local database private; they are excluded from Git.

## API

All routes are under `/api`. Successful auth responses return `{ "user": ..., "token": "..." }`. Send the token as `Authorization: Bearer <token>` to protected routes. Vehicle responses use a decimal USD `price`; SQLite stores integer cents.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register as a customer |
| `POST` | `/auth/login` | Public | Authenticate and receive a JWT |
| `GET` | `/vehicles` | Authenticated | List vehicles; accepts search query fields |
| `GET` | `/vehicles/search` | Authenticated | Search by `make`, `model`, `category`, `minPrice`, `maxPrice` |
| `POST` | `/vehicles` | Authenticated | Add a vehicle |
| `PUT` | `/vehicles/:id` | Authenticated | Update vehicle fields |
| `DELETE` | `/vehicles/:id` | Admin | Delete a vehicle |
| `POST` | `/vehicles/:id/purchase` | Authenticated | Purchase one unit |
| `POST` | `/vehicles/:id/restock` | Admin | Add stock with `{ "quantity": 5 }` |

Example vehicle body:

```json
{
  "make": "Toyota",
  "model": "Corolla",
  "category": "Sedan",
  "price": 24500,
  "quantity": 4
}
```

Validation errors use a consistent `{ "error": { "code": "...", "message": "..." } }` response. A purchase against zero stock returns HTTP `409`; invalid input returns `400`; missing/invalid authentication returns `401`; insufficient role returns `403`.

## Database design

- `roles`: unique role name (`customer`, `admin`).
- `users`: name, case-insensitive unique email, password hash, role foreign key, and timestamps. Public registration always assigns `customer`.
- `vehicles`: unique integer ID, make, model, category, non-negative `price_cents`, non-negative `quantity`, and timestamps. Make/model/category/price indexes support filtering.

The initial admin is created only by the explicit seed script using environment credentials; the public API has no role-promotion endpoint.

## Tests and production build

Run both test suites and production builds:

```powershell
npm test
npm run build
```

Current test report:

- Backend: 9 passing tests across API integration, authentication, role enforcement, atomic stock operations, and database constraints/migrations.
- Frontend: 6 passing component/auth-flow tests covering search filters, out-of-stock purchase state, sign-in, registration, and API error feedback.
- Dependency audit at implementation time: no known vulnerabilities (`npm audit`).

The backend production entrypoint is `npm start -w backend` after `npm run build`. The frontend production bundle is in `frontend/dist`; use `npm run preview -w frontend` for a local production preview.

## Screenshots

![Signed-in admin inventory dashboard](./screenshots/inventory-admin.png)

## My AI Usage

I used GitHub Copilot in VS Code to help interpret the supplied kata requirements, plan the workspace and database design, scaffold tests before implementation, implement the backend and frontend modules, and troubleshoot type/build/test failures. I reviewed the generated changes, confirmed the authorization and purchase-history scope, and ran the project tests, builds, and dependency audit. AI assistance accelerated boilerplate and test iteration; I remain responsible for understanding, validating, and explaining the design and code.

## Prompt log

`PROMPTS.md` preserves the original project prompt and scope confirmation as raw user-provided text. Add any further raw AI chat logs or public chat links there without summarizing them.

## Git and AI co-authorship

The local Git history contains separate test-first, backend, and frontend/documentation commits. For AI-assisted commits, each commit includes the required AI `Co-authored-by` trailer from the kata instructions. No Git remote or public repository URL has been configured.
