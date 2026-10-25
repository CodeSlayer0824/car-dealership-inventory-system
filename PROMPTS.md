# AI Prompt Log --- Car Dealership Inventory System

This file preserves the prompts supplied for the project. The wording is
cleaned up for Markdown readability; missing conversation messages are
not reconstructed.

------------------------------------------------------------------------

## 1. Initial Planning Prompt

**Reference document:**
`AI_Kata_Car_Dealership_Inventory_System_V2.docx`

Please read the attached requirements document named
`AI_Kata_Car_Dealership_Inventory_System_V2.docx` located in the root
directory.

We are going to build this full-stack Car Dealership Inventory System
using Node.js, Express, TypeScript, and SQLite for the backend, and a
modern React + Vite + Tailwind CSS frontend.

Since we are following a strict Test-Driven Development (TDD) workflow
and need to keep the architecture clean, modular, and easy to run
locally, please do **not** write any code yet. Instead, provide a
comprehensive, step-by-step implementation plan covering:

1.  The exact folder and file structure for both backend and frontend.
2.  The database schema design (Users, Vehicles, Roles).
3.  The step-by-step development order (e.g., setting up the Express
    server, writing auth tests, building routes, and then building the
    React SPA).

Give me the plan first so I can review it before we generate any files.

### Scope confirmation

The following scope decisions were confirmed during the planning
discussion:

-   `vehicleManagementAccess=literal_api`
-   `purchaseHistory=stock_only`
-   `adminProvisioning=env_seed`

------------------------------------------------------------------------

## 2. Development Error: JWT Secret

Inspect this ZIP file and tell me why I'm getting this error.

``` powershell
PS C:\Users\864su\Downloads\PlacementCompanies\Incubyte\CarDealershipInventorySystemV2> npm run dev

> dev
> concurrently -k -n api,web -c blue,green "npm run dev -w backend" "npm run dev -w frontend"

[web]
[web] > dealership-frontend@1.0.0 dev
[web] > vite --host 0.0.0.0

[api]
[api] > dealership-backend@1.0.0 dev
[api] > tsx watch src/server.ts

[web]
[web] VITE v7.3.7 ready in 741 ms
[web] Local:   http://localhost:5173/
[web] Network: http://172.16.0.2:5173/
[web] Network: http://192.168.29.2:5173/

[api] C:\Users\864su\Downloads\PlacementCompanies\Incubyte\CarDealershipInventorySystemV2\backend\src\server.ts:12
[api]   throw new Error("JWT_SECRET must be set and contain at least 32 characters");
[api]         ^

[api] Error: JWT_SECRET must be set and contain at least 32 characters
[api]     at <anonymous> (C:\Users\864su\Downloads\PlacementCompanies\Incubyte\CarDealershipInventorySystemV2\backend\src\server.ts:12:9)
[api]     at ModuleJob.run (node:internal/modules/esm/module_job:561:25)
[api]     at async node:internal/modules/esm/loader:647:26
[api]     at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:11)

[api] Node.js v24.21.0
PS C:\Users\864su\Downloads\PlacementCompanies\Incubyte\CarDealershipInventorySystemV2> [web] Terminate batch job (Y/N)?
[api] Terminate batch job (Y/N)?
[api] npm run dev -w backend exited with code 1
--> Sending SIGTERM to other processes..
[web] npm run dev -w frontend exited with code 1
```

------------------------------------------------------------------------

## 3. Development Error: Admin Seed Password

The project runs, but login throws an error saying **"Invalid username
or password."**

Please inspect the terminal output below:

``` powershell
C:\Users\864su\Downloads\PlacementCompanies\Incubyte\CarDealershipInventorySystemV2> npm run seed:admin -w backend

> dealership-backend@1.0.0 seed:admin
> tsx src/db/seed-admin.ts

C:\Users\864su\Downloads\PlacementCompanies\Incubyte\CarDealershipInventorySystemV2\backend\src\db\seed-admin.ts:16
if (password.length < 12) throw new Error("ADMIN_PASSWORD must contain at least 12 characters");
                          ^

Error: ADMIN_PASSWORD must contain at least 12 characters
    at <anonymous> (C:\Users\864su\Downloads\PlacementCompanies\Incubyte\CarDealershipInventorySystemV2\backend\src\db\seed-admin.ts:16:33)
    at ModuleJob.run (node:internal/modules/esm/module_job:561:25)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/esm/loader:647:26)

Node.js v24.21.0
npm error Lifecycle script `seed:admin` failed with error:
npm error code 1
npm error path C:\Users\864su\Downloads\PlacementCompanies\Incubyte\CarDealershipInventorySystemV2\backend
npm error workspace dealership-backend@1.0.0
npm error location C:\Users\864su\Downloads\PlacementCompanies\Incubyte\CarDealershipInventorySystemV2\backend
npm error command failed
npm error command C:\WINDOWS\system32\cmd.exe /d /s /c tsx src/db/seed-admin.ts
```

------------------------------------------------------------------------

## 4. Improve the Existing Car Dealership Inventory System

Inspect and improve my existing project. Do not rebuild it, change the
technology stack, or introduce unnecessary complexity.

Keep the existing Node.js + Express backend, React frontend, Tailwind
CSS, SQLite database, JWT authentication and current project structure.
Reuse existing code, API endpoints and database tables wherever
practical.

### 4.1 Inspect before changing anything

Before editing:

-   Inspect the project structure, existing customer and admin
    workflows, API routes, database schema, authentication and
    authorization middleware.
-   Inspect how purchases and stock quantities currently work.
-   Check Git status and preserve all existing uncommitted work.
-   Identify which requested features already exist and implement only
    what is missing or incorrect.
-   Do not assume a feature is missing just because it is not
    immediately visible.

### 4.2 Customer shopping cart

Replace direct purchasing from the inventory page with a simple shopping
cart workflow.

-   Customers can browse, search and filter available vehicles.
-   Replace the direct **Purchase** button on inventory cards with an
    **Add to Cart** button.
-   Provide a Cart page or panel showing the selected vehicles,
    quantities and prices.
-   Allow customers to increase or decrease quantities and remove items
    from the cart.
-   Prevent quantities from exceeding available stock.
-   Show the subtotal and total clearly.
-   Prevent checkout when the cart is empty or the selected quantities
    are invalid.
-   Do not allow admins to add vehicles to a shopping cart or purchase
    them.
-   Keep the cart simple. Prefer the existing application state and
    architecture. If the cart must persist across refreshes or login
    sessions, use an appropriate existing mechanism rather than
    introducing an unnecessary new service.

### 4.3 Checkout and purchase processing

When a customer confirms checkout:

-   Validate the cart and stock quantities on the backend.
-   Recheck available stock immediately before completing the purchase.
-   Process stock changes and purchase records consistently, using a
    database transaction where appropriate.
-   Prevent negative stock and prevent two concurrent purchases from
    overselling the same stock.
-   Record the customer, vehicle, quantity, price at the time of
    purchase and purchase timestamp, using the existing schema where
    possible.
-   Clear the cart only after checkout succeeds.
-   If checkout fails, show a useful error and preserve the cart so the
    customer can try again.
-   Prevent duplicate orders if a request is retried.
-   Do not claim that payment is processed if the project does not have
    a payment integration. Treat checkout as an order confirmation
    unless a payment feature already exists.

### 4.4 Customer order history and cancellation

Add a simple **My Orders** page for customers.

Display each order's identifier, vehicle details, quantity, purchase
price and date, along with its current status.

Allow customers to cancel an eligible order using a **Cancel Order**
button.

Cancellation rules:

-   Customers can cancel only their own orders.
-   Define and enforce a simple cancellation eligibility rule based on
    the existing order model. If no order lifecycle exists, use a clear
    rule such as allowing cancellation while the order is still pending.
-   Once an order has been cancelled, it cannot be cancelled again or
    purchased again through the same order.
-   Restore the correct stock quantity exactly once when cancellation
    succeeds.
-   Update the order status to `cancelled` rather than deleting the
    order record.
-   Perform the status change and stock restoration atomically.
-   Reject cancellation requests for orders that are already cancelled
    or are no longer eligible.
-   Show the customer the cancellation result and the updated order
    status.

Do not introduce shipping, delivery tracking, refunds or a complex order
lifecycle unless those features already exist.

### 4.5 Admin dashboard and purchase history

Provide a simple admin dashboard with:

-   Total registered customer accounts, excluding admin accounts.
-   Total vehicles in inventory.
-   Total orders or purchases, using the existing data.

Add an admin-only order/purchase history view showing the customer,
vehicle, quantity, purchase price, date and order status. Include
cancelled orders so the admin can review the order history.

Use the existing database and relationships. Do not add charts,
analytics libraries or a separate reporting system.

### 4.6 Role-based permissions

Keep the existing role model and enforce permissions in both the
frontend and backend.

**Admins:**

-   Can add, edit, delete and restock vehicles.
-   Can view administrative statistics and all customer orders.
-   Cannot add vehicles to a cart, checkout or purchase vehicles.

**Customers:**

-   Can browse, search and filter vehicles.
-   Can add and remove cart items, update quantities, and checkout.
-   Can view only their own order history and cancel only their own
    eligible orders.
-   Cannot add, edit, delete or restock vehicles.
-   Cannot access admin statistics or the admin purchase history.

Do not rely on hiding buttons as a security measure. Protect API routes
and validate ownership on the server.

### 4.7 Customer profile

Provide a simple Profile page where an authenticated customer can edit
their name.

-   Load the current name from the database.
-   Validate the updated name.
-   Save changes to the existing user record.
-   Allow users to update only their own profile.
-   Display clear success and error messages.

Do not add unnecessary profile fields.

### 4.8 Duplicate vehicle prevention

Prevent an admin from adding a vehicle if a vehicle with the same
normalized make, model, category and price already exists.

For example, a Toyota Corolla in the SUV category at ₹15,00,000 must not
be added again with those same values.

-   Validate duplicates in the backend.
-   Treat capitalization and surrounding whitespace consistently.
-   Add an appropriate database-level safeguard where practical.
-   Check existing records before introducing constraints.
-   Do not automatically delete or merge existing records.
-   Return a clear error message when a duplicate is rejected.

### 4.9 Vehicle edit dialog

Make the admin's **Edit Details** action open a modal dialog.

-   Pre-fill all supported vehicle fields with the current values.
-   Display the existing vehicle image.
-   Allow editing of the supported fields, including make, model,
    category, price and quantity.
-   Save through the existing update API.
-   Update the existing vehicle record rather than creating another
    record.
-   Validate input and display useful errors.
-   Keep the Add Vehicle form separate.
-   Customers must not see this edit option.

### 4.10 Database consistency and migrations

-   Preserve existing user, vehicle and order identifiers.
-   Reuse the current SQLite database and existing relationships
    wherever possible.
-   Inspect the existing purchase schema before adding or changing
    tables.
-   Avoid duplicate order records and double stock restoration.
-   Ensure order creation, cancellation and inventory changes remain
    consistent.
-   Apply schema changes safely without deleting existing data.
-   Do not reset the database or remove existing user accounts, vehicles
    or purchase records.
-   If a migration is required, make it safe for existing data and
    document it.

### 4.11 Testing requirements

Add or update tests for:

-   Cart quantity validation and item removal.
-   Checkout with valid and insufficient stock.
-   Concurrent or repeated checkout requests where relevant.
-   Stock reduction and purchase record creation.
-   Order history ownership and admin access.
-   Successful and repeated cancellation attempts.
-   Stock restoration exactly once after cancellation.
-   Admins being unable to purchase.
-   Customers being unable to modify inventory.
-   Customer profile updates and ownership.
-   Duplicate vehicle prevention.
-   Vehicle editing and database consistency.

Run the existing backend and frontend test suites and production builds.
Fix failures caused by the changes and rerun the required checks.

Also perform practical browser checks of both customer and admin
workflows when possible. Clearly distinguish automated tests from manual
checks.

### 4.12 Git and commit rules

-   Preserve all existing work and inspect the final diff.
-   Do not stage secrets, `.env` files or unrelated changes.
-   Do not use destructive Git commands or rewrite history.
-   **Commit only if all required tests and production builds pass.**
-   If any required test or build fails, do not commit. Leave the
    changes available for review and explain the failure.
-   Do not push to GitHub. I will review and push the changes myself.

### 4.13 Final report

Provide a concise report describing:

1.  Features implemented.
2.  Files changed.
3.  Any database migrations.
4.  Actual test and build results.
5.  Manual checks completed.
6.  Any remaining issues.
7.  Commit hash, only if a commit was created.
8.  A beginner-friendly explanation of the cart, checkout, cancellation
    and stock update logic.

Do not fabricate test results. Do not rebuild working features
unnecessarily. Prioritize correctness, security, database consistency
and minimal changes over extra functionality.
