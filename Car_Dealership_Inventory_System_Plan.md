# Car Dealership Inventory System — Implementation Plan

## Problem and proposed approach

Build the requirements in `AI_Kata_Car_Dealership_Inventory_System_V2.docx` as a locally runnable TypeScript monorepo: an Express REST API backed by persistent SQLite and a React/Vite/Tailwind single-page application. Work backend-first with a strict red-green-refactor loop, then connect and test the frontend against the real API. Keep business logic outside route handlers, enforce authentication and role checks on the server, and document run/test instructions and the required AI-usage deliverables.

## Confirmed scope and decisions

- Use an npm-workspaces monorepo with separate `backend/` and `frontend/` packages; no shared package initially.
- Use SQLite with versioned SQL migrations and a persistent local database file; use a separate temporary/in-memory SQLite database only in tests.
- Store price as integer cents and stock as a non-negative integer.
- Register users as the ordinary `customer` role; never allow public registration to choose `admin`. Provide an explicit development/admin seed mechanism rather than a public role-promotion route.
- Follow the API wording literally for authorization: authenticated users may create/update vehicles; only admins may delete/restock. Reflect those same permissions in the frontend.
- Purchase decrements stock atomically and returns a conflict when no stock remains. Do not add purchase-history/order tables.
- Provision the initial local admin through an explicit seed script using environment-provided credentials; do not expose role promotion publicly.
- Use JWT bearer tokens; hash passwords with a maintained password-hashing library; validate inputs and return consistent JSON errors.
- Backend test approach: Node's test runner or the project-standard TypeScript-compatible runner with Supertest; frontend: Vitest and React Testing Library. Select and configure a compatible runner during setup.

## Proposed repository and file structure

```text
CarDealershipInventorySystemV2/
├── .gitignore
├── .env.example
├── package.json                    # npm workspaces and root dev/test scripts
├── README.md                       # setup, API, screenshots, test report, My AI Usage
├── PROMPTS.md                      # raw, unedited AI chat logs or public links
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts             # or equivalent runner configuration
│   ├── src/
│   │   ├── app.ts                   # Express app composition (no listen side effect)
│   │   ├── server.ts                # process startup and graceful shutdown
│   │   ├── config/
│   │   │   └── env.ts               # validated configuration
│   │   ├── db/
│   │   │   ├── connection.ts        # SQLite connection lifecycle
│   │   │   ├── migrate.ts           # apply ordered migrations
│   │   │   ├── seed.ts              # roles and explicit admin bootstrap
│   │   │   └── migrations/
│   │   │       └── 001_initial_schema.sql
│   │   ├── middleware/
│   │   │   ├── authenticate.ts
│   │   │   ├── authorize.ts
│   │   │   ├── validate.ts
│   │   │   └── errorHandler.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.repository.ts
│   │   │   │   └── auth.schemas.ts
│   │   │   └── vehicles/
│   │   │       ├── vehicles.routes.ts
│   │   │       ├── vehicles.controller.ts
│   │   │       ├── vehicles.service.ts
│   │   │       ├── vehicles.repository.ts
│   │   │       └── vehicles.schemas.ts
│   │   ├── errors/
│   │   │   └── AppError.ts
│   │   └── types/
│   │       └── express.d.ts         # authenticated-user request typing
│   └── tests/
│       ├── helpers/
│       │   └── testApp.ts
│       ├── auth/
│       │   ├── auth.service.test.ts
│       │   └── auth.routes.test.ts
│       ├── vehicles/
│       │   ├── vehicles.service.test.ts
│       │   └── vehicles.routes.test.ts
│       └── db/
│           └── migrations.test.ts
└── frontend/
    ├── package.json
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── styles/
        │   └── index.css
        ├── lib/
        │   ├── apiClient.ts         # base URL, bearer token, error mapping
        │   └── authStorage.ts       # token persistence abstraction
        ├── types/
        │   ├── auth.ts
        │   └── vehicle.ts
        ├── components/
        │   ├── AppLayout.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── AdminRoute.tsx
        │   ├── LoadingState.tsx
        │   └── ErrorMessage.tsx
        └── features/
            ├── auth/
            │   ├── AuthProvider.tsx
            │   ├── LoginPage.tsx
            │   ├── RegisterPage.tsx
            │   └── authApi.ts
            └── vehicles/
                ├── InventoryPage.tsx
                ├── VehicleList.tsx
                ├── VehicleCard.tsx
                ├── VehicleSearch.tsx
                ├── VehicleForm.tsx
                ├── PurchaseButton.tsx
                └── vehiclesApi.ts
```

Add or rename files only when implementation reveals a concrete need; keep the module boundaries and responsibilities above.

## Database schema

Use foreign keys, parameterized queries, `NOT NULL` constraints, and database-level checks in addition to service validation.

### `roles`

| Column | Type | Constraints / purpose |
|---|---|---|
| `id` | `INTEGER` | Primary key |
| `name` | `TEXT` | Required, unique; seed `customer` and `admin` |

### `users`

| Column | Type | Constraints / purpose |
|---|---|---|
| `id` | `INTEGER` | Primary key |
| `name` | `TEXT` | Required |
| `email` | `TEXT` | Required, unique; normalize case before storage/lookups |
| `password_hash` | `TEXT` | Required; never store or return plaintext password |
| `role_id` | `INTEGER` | Required FK to `roles.id`; default to customer in registration service |
| `created_at` | `TEXT` | Required UTC timestamp |
| `updated_at` | `TEXT` | Required UTC timestamp |

### `vehicles`

| Column | Type | Constraints / purpose |
|---|---|---|
| `id` | `INTEGER` | Primary key, unique vehicle identifier |
| `make` | `TEXT` | Required, non-empty |
| `model` | `TEXT` | Required, non-empty |
| `category` | `TEXT` | Required, non-empty |
| `price_cents` | `INTEGER` | Required, non-negative |
| `quantity` | `INTEGER` | Required, non-negative; default 0 |
| `created_at` | `TEXT` | Required UTC timestamp |
| `updated_at` | `TEXT` | Required UTC timestamp |

Add indexes suitable for make/model/category and price search after defining and testing the search query. Define a stable API DTO that presents prices consistently (either cents or a decimal currency amount); use one representation across API, UI, and documentation.

## Development order (TDD)

1. **Repository/tooling baseline** — Create workspace package manifests, TypeScript configs, formatting/lint/test scripts, environment example, and ignore rules. Verify clean install and a minimal test in each package. No feature implementation before its tests.
2. **Backend app and database seam** — Test app construction without listening, SQLite connection lifecycle, migration application, role seeds, and schema constraints. Implement Express app composition, error handling, migration and test-database setup.
3. **Authentication tests first** — Specify registration validation, duplicate email, password hashing, login success/failure, token claims/expiry, and protected-route behavior. Implement auth repository/service/controller/routes and JWT middleware to make those tests pass.
4. **Authorization tests** — Specify customer/admin access for each protected action and prove request-supplied role data cannot grant admin access. Implement role authorization middleware and seed-only admin bootstrap.
5. **Vehicle CRUD tests first** — Cover authenticated listing, create/update validation, not-found cases, make/model/category filtering and inclusive price bounds, and admin-only delete. Implement repository queries, services, validation and REST routes.
6. **Inventory operation tests first** — Cover purchase decrement, zero-stock conflict, invalid quantity, restock increment, admin enforcement, and concurrent/atomic update behavior. Implement conditional SQL updates/transactions so stock cannot become negative.
7. **API integration verification** — Exercise all required paths end-to-end with isolated persistent test databases and token roles; verify status codes, JSON shapes, errors, and data persistence across connection/app restart.
8. **Frontend foundation** — Add Vite, React, TypeScript, Tailwind, routing, API base URL configuration and component test setup. Validate app shell and responsive layout.
9. **Frontend auth TDD** — Test registration/login forms, validation/error/loading states, token handling, protected pages and role-aware rendering; implement auth API/provider and pages.
10. **Inventory UI TDD** — Test inventory display, filtering, empty/loading/error states, purchase button disabled at zero stock, successful purchase refresh, and management affordances according to the confirmed role policy. Implement vehicle API clients, pages, cards, search, and forms.
11. **Full-stack acceptance pass** — Run backend and frontend together locally against SQLite; validate customer/admin journeys, search boundaries, zero-stock behavior, responsive layouts, and failure messages. Fix integration issues and run targeted then full test suites.
12. **Delivery/documentation** — Add detailed local setup/run instructions, architecture/API/schema summary, screenshots, reproducible test report, and the mandatory `My AI Usage` section to README. Maintain `PROMPTS.md` as raw unedited logs or public links; do not place generated summaries there. Provide `.env.example` without real credentials.
13. **Git workflow and review** — Initialize/use Git as applicable, commit in small red-green-refactor increments with descriptive messages, and include the required AI co-author trailer for AI-assisted commits. Do not claim a public repository/deployment exists until one is actually created.

## Notes / considerations

- The user requested planning only: do not create project source/configuration files until the plan is approved.
- Confirmed interpretation: create/update require authentication; delete/restock require admin; purchase updates stock only, without recording order history; local admin is provisioned through environment-configured seed credentials.
- Currency display/API representation is not specified. Choose one consistent representation across API, UI, and documentation before implementing.
- Test temporary SQLite databases must be isolated and cleaned up; production/development databases must persist outside transient test setup.
- Never log passwords, JWT secrets, or raw authorization headers. Keep JWT and admin bootstrap secrets in environment configuration.
