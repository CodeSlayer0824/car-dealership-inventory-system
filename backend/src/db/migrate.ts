import type Database from "better-sqlite3";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const migrations = [
  {
    version: "001_initial_schema",
    paths: [
      resolve(currentDirectory, "migrations/001_initial_schema.sql"),
      resolve(currentDirectory, "../../src/db/migrations/001_initial_schema.sql"),
      resolve(process.cwd(), "backend/src/db/migrations/001_initial_schema.sql"),
    ],
  },
  {
    version: "002_orders_and_vehicle_identity",
    paths: [
      resolve(currentDirectory, "migrations/002_orders_and_vehicle_identity.sql"),
      resolve(currentDirectory, "../../src/db/migrations/002_orders_and_vehicle_identity.sql"),
      resolve(process.cwd(), "backend/src/db/migrations/002_orders_and_vehicle_identity.sql"),
    ],
  },
];

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  for (const migration of migrations) {
    if (db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?").get(migration.version)) {
      continue;
    }
    const path = migration.paths.find(existsSync);
    if (!path) throw new Error(`Unable to locate migration ${migration.version}`);
    const sql = readFileSync(path, "utf8");
    db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(migration.version);
    })();
  }
}
