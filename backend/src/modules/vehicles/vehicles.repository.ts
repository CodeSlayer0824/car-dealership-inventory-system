import type Database from "better-sqlite3";

function isDuplicateVehicleError(error: unknown): boolean {
  return typeof error === "object" && error !== null &&
    "code" in error && error.code === "SQLITE_CONSTRAINT_UNIQUE";
}

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
    try {
      const result = this.db
        .prepare(
          "INSERT INTO vehicles (make, model, category, price_cents, quantity) VALUES (?, ?, ?, ?, ?)",
        )
        .run(input.make.trim(), input.model.trim(), input.category.trim(), input.priceCents, input.quantity);
      const vehicle = this.findById(Number(result.lastInsertRowid));
      if (!vehicle) throw new Error("New vehicle could not be loaded");
      return vehicle;
    } catch (error) {
      if (isDuplicateVehicleError(error)) {
        throw new Error("A vehicle with this make, model, category, and price already exists", { cause: error });
      }
      throw error;
    }
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
      try {
        this.db
          .prepare(`UPDATE vehicles SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(...values, id);
      } catch (error) {
        if (isDuplicateVehicleError(error)) {
          throw new Error("A vehicle with this make, model, category, and price already exists", { cause: error });
        }
        throw error;
      }
    }
    return this.findById(id);
  }

  delete(id: number): "deleted" | "not_found" | "pending_order" {
    const result = this.db.prepare(
      `DELETE FROM vehicles
       WHERE id = ?
         AND NOT EXISTS (
           SELECT 1 FROM order_items
           JOIN orders ON orders.id = order_items.order_id
           WHERE order_items.vehicle_id = vehicles.id AND orders.status = 'pending'
         )`,
    ).run(id);
    if (result.changes) return "deleted";
    if (!this.findById(id)) return "not_found";
    return "pending_order";
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
