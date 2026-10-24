import type Database from "better-sqlite3";

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
}

export class AuthRepository {
  constructor(private readonly db: Database.Database) {}

  findByEmail(email: string): UserRecord | undefined {
    return this.db
      .prepare(
        `SELECT users.id, users.name, users.email, users.password_hash, roles.name AS role
         FROM users JOIN roles ON roles.id = users.role_id WHERE users.email = ?`,
      )
      .get(email) as UserRecord | undefined;
  }

  findById(id: number): Pick<UserRecord, "id" | "name" | "email" | "role"> | undefined {
    return this.db
      .prepare(
        `SELECT users.id, users.name, users.email, roles.name AS role
         FROM users JOIN roles ON roles.id = users.role_id WHERE users.id = ?`,
      )
      .get(id) as Pick<UserRecord, "id" | "name" | "email" | "role"> | undefined;
  }

  create(name: string, email: string, passwordHash: string): number {
    const role = this.db.prepare("SELECT id FROM roles WHERE name = 'customer'").get() as
      | { id: number }
      | undefined;
    if (!role) throw new Error("Customer role is missing from database");
    const result = this.db
      .prepare(
        "INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)",
      )
      .run(name, email, passwordHash, role.id);
    return Number(result.lastInsertRowid);
  }
}
