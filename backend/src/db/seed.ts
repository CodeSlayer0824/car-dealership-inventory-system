import type Database from "better-sqlite3";
import { AppError } from "../errors/AppError.js";
import { hashPassword } from "../modules/auth/password.js";

export async function seedAdmin(
  db: Database.Database,
  input: { name: string; email: string; password: string },
): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    const isAdmin = db
      .prepare(
        `SELECT 1 FROM users JOIN roles ON roles.id = users.role_id
         WHERE users.email = ? AND roles.name = 'admin'`,
      )
      .get(email);
    if (isAdmin) return;
    throw new AppError(409, "Admin email already belongs to a non-admin account", "EMAIL_EXISTS");
  }
  const passwordHash = await hashPassword(input.password);
  db.prepare(
    `INSERT INTO users (name, email, password_hash, role_id)
     VALUES (?, ?, ?, (SELECT id FROM roles WHERE name = 'admin'))`,
  ).run(input.name.trim(), email, passwordHash);
}
