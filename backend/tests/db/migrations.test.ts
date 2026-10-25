import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { createDatabase } from "../../src/db/connection.js";
import { runMigrations } from "../../src/db/migrate.js";

describe("database migrations", () => {
  const databases: ReturnType<typeof createDatabase>[] = [];

  afterEach(() => {
    for (const db of databases.splice(0)) db.close();
  });

  it("records and safely skips migrations that have already run", () => {
    const db = createDatabase(":memory:");
    databases.push(db);
    runMigrations(db);
    const migrations = db.prepare("SELECT version FROM schema_migrations").all();
    expect(migrations).toEqual([
      { version: "001_initial_schema" },
      { version: "002_orders_and_vehicle_identity" },
    ]);
    expect(db.prepare("SELECT name FROM roles ORDER BY name").all()).toEqual([
      { name: "admin" },
      { name: "customer" },
    ]);
  });

  it("adds orders to an existing database without changing user or vehicle IDs", () => {
    const legacyDb = new Database(":memory:");
    databases.push(legacyDb);
    legacyDb.exec(`
      CREATE TABLE roles (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL,
        role_id INTEGER NOT NULL REFERENCES roles(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT, make TEXT NOT NULL, model TEXT NOT NULL,
        category TEXT NOT NULL, price_cents INTEGER NOT NULL, quantity INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      INSERT INTO roles VALUES (1, 'customer'), (2, 'admin');
      INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');
      INSERT INTO users (name, email, password_hash, role_id) VALUES ('Preserved', 'preserved@example.com', 'hash', 1);
      INSERT INTO vehicles (make, model, category, price_cents, quantity) VALUES ('Existing', 'Car', 'Sedan', 12345, 7);
    `);
    const userId = legacyDb.prepare("SELECT id FROM users WHERE email = 'preserved@example.com'").get();
    const vehicleId = legacyDb.prepare("SELECT id FROM vehicles WHERE make = 'Existing'").get();
    runMigrations(legacyDb);
    const migration = legacyDb.prepare("SELECT version FROM schema_migrations WHERE version = '002_orders_and_vehicle_identity'").get();
    expect(migration).toEqual({ version: "002_orders_and_vehicle_identity" });
    expect(legacyDb.prepare("SELECT name, email FROM users WHERE id = ?").get(userId.id))
      .toEqual({ name: "Preserved", email: "preserved@example.com" });
    expect(legacyDb.prepare("SELECT make, quantity FROM vehicles WHERE id = ?").get(vehicleId.id))
      .toEqual({ make: "Existing", quantity: 7 });
    expect(vehicleId.id).toBe(1);
    expect(legacyDb.prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
  });

  it("enforces non-negative vehicle stock and price", () => {
    const db = createDatabase(":memory:");
    databases.push(db);
    expect(() =>
      db.prepare(
        "INSERT INTO vehicles (make, model, category, price_cents, quantity) VALUES ('A', 'B', 'C', 100, -1)",
      ).run(),
    ).toThrow();
    expect(() =>
      db.prepare(
        "INSERT INTO vehicles (make, model, category, price_cents, quantity) VALUES ('A', 'B', 'C', -1, 0)",
      ).run(),
    ).toThrow();
  });

  it("prevents duplicate normalized vehicles but permits a different price", () => {
    const db = createDatabase(":memory:");
    databases.push(db);
    const insert = db.prepare(
      "INSERT INTO vehicles (make, model, category, price_cents, quantity) VALUES (?, ?, ?, ?, ?)",
    );
    insert.run(" Toyota ", "Corolla", "SUV", 1500000, 3);
    expect(() => insert.run("toyota", " Corolla ", "suv", 1500000, 8)).toThrow();
    expect(() => insert.run("Toyota", "Corolla", "SUV", 1500001, 1)).not.toThrow();
  });
});
