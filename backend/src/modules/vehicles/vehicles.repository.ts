import type Database from "better-sqlite3";

export interface VehicleRecord {
  id: number;
  make: string;
  model: string;
  category: string;
  price_cents: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export class VehiclesRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(filters: VehicleFilters = {}): VehicleRecord[] {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    for (const field of ["make", "model", "category"] as const) {
      const value = filters[field];
      if (value) {
        clauses.push(`${field} LIKE ? COLLATE NOCASE`);
        values.push(`%${value}%`);
      }
    }
    if (filters.minPrice !== undefined) {
      clauses.push("price_cents >= ?");
      values.push(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      clauses.push("price_cents <= ?");
      values.push(filters.maxPrice);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    return this.db
      .prepare(`SELECT * FROM vehicles ${where} ORDER BY make COLLATE NOCASE, model COLLATE NOCASE`)
      .all(...values) as VehicleRecord[];
  }

  findById(id: number): VehicleRecord | undefined {
    return this.db.prepare("SELECT * FROM vehicles WHERE id = ?").get(id) as
      | VehicleRecord
      | undefined;
  }

  create(input: {
    make: string;
    model: string;
    category: string;
    priceCents: number;
    quantity: number;
  }): VehicleRecord {
    const result = this.db
      .prepare(
        "INSERT INTO vehicles (make, model, category, price_cents, quantity) VALUES (?, ?, ?, ?, ?)",
      )
      .run(input.make, input.model, input.category, input.priceCents, input.quantity);
    return this.findById(Number(result.lastInsertRowid))!;
  }

  update(
    id: number,
    input: Partial<{
      make: string;
      model: string;
      category: string;
      priceCents: number;
      quantity: number;
    }>,
  ): VehicleRecord | undefined {
    const columns = {
      make: input.make,
      model: input.model,
      category: input.category,
      price_cents: input.priceCents,
      quantity: input.quantity,
    };
    const updates = Object.entries(columns).filter((entry) => entry[1] !== undefined);
    if (updates.length) {
      const assignments = updates.map(([column]) => `${column} = ?`).join(", ");
      const values = updates.map(([, value]) => value as string | number);
      this.db
        .prepare(`UPDATE vehicles SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(...values, id);
    }
    return this.findById(id);
  }

  delete(id: number): boolean {
    return this.db.prepare("DELETE FROM vehicles WHERE id = ?").run(id).changes > 0;
  }

  purchaseOne(id: number): number {
    return this.db
      .prepare(
        "UPDATE vehicles SET quantity = quantity - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND quantity > 0",
      )
      .run(id).changes;
  }

  restock(id: number, quantity: number): number {
    return this.db
      .prepare(
        "UPDATE vehicles SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND quantity <= ?",
      )
      .run(quantity, id, 2147483647 - quantity).changes;
  }
}
