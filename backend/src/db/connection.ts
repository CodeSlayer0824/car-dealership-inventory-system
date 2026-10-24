import Database from "better-sqlite3";
import { runMigrations } from "./migrate.js";

export function createDatabase(path: string): Database.Database {
  const db = new Database(path);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  runMigrations(db);
  db.prepare("INSERT OR IGNORE INTO roles (name) VALUES (?), (?)").run("customer", "admin");
  return db;
}
