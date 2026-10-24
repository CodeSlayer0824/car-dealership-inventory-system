import { afterEach, describe, expect, it } from "vitest";
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
    expect(migrations).toEqual([{ version: "001_initial_schema" }]);
    expect(db.prepare("SELECT name FROM roles ORDER BY name").all()).toEqual([
      { name: "admin" },
      { name: "customer" },
    ]);
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
});
