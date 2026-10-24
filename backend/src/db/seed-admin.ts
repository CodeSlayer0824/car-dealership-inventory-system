import dotenv from "dotenv";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createDatabase } from "./connection.js";
import { seedAdmin } from "./seed.js";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

const databasePath = resolve(process.env.DATABASE_PATH ?? "./data/inventory.sqlite");
const name = process.env.ADMIN_NAME;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!name || !email || !password) {
  throw new Error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set before seeding");
}
if (password.length < 12) throw new Error("ADMIN_PASSWORD must contain at least 12 characters");

mkdirSync(dirname(databasePath), { recursive: true });
const db = createDatabase(databasePath);
try {
  await seedAdmin(db, { name, email, password });
  console.log(`Admin account ready for ${email.trim().toLowerCase()}`);
} finally {
  db.close();
}
