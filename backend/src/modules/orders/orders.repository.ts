import type Database from "better-sqlite3";
import { AppError } from "../../errors/AppError.js";

export interface CheckoutItem {
  vehicleId: number;
  quantity: number;
}

interface VehicleSnapshot {
  id: number;
  make: string;
  model: string;
  category: string;
  price_cents: number;
  quantity: number;
}

interface OrderRow {
  id: number;
  customer_id: number;
  status: "pending" | "cancelled";
  created_at: string;
}

interface OrderItemRow {
  id: number;
  vehicle_id: number | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_category: string;
  quantity: number;
  unit_price_cents: number;
}

export interface OrderResult {
  id: number;
  customerId: number;
  status: "pending" | "cancelled";
  createdAt: string;
  items: Array<{
    id: number;
    vehicleId: number | null;
    make: string;
    model: string;
    category: string;
    quantity: number;
    price: number;
  }>;
  customer?: { name: string; email: string };
}

function presentOrder(row: OrderRow, items: OrderItemRow[], customer?: { name: string; email: string }): OrderResult {
  return {
    id: row.id,
    customerId: row.customer_id,
    status: row.status,
    createdAt: row.created_at,
    items: items.map((item) => ({
      id: item.id,
      vehicleId: item.vehicle_id,
      make: item.vehicle_make,
      model: item.vehicle_model,
      category: item.vehicle_category,
      quantity: item.quantity,
      price: item.unit_price_cents / 100,
    })),
    ...(customer ? { customer } : {}),
  };
}

export class OrdersRepository {
  constructor(private readonly db: Database.Database) {}

  private readOrder(id: number, customerId?: number): OrderResult | undefined {
    const whereCustomer = customerId === undefined ? "" : "AND customer_id = ?";
    const row = this.db
      .prepare(`SELECT id, customer_id, status, created_at FROM orders WHERE id = ? ${whereCustomer}`)
      .get(...(customerId === undefined ? [id] : [id, customerId])) as OrderRow | undefined;
    if (!row) return undefined;
    const items = this.db
      .prepare(
        `SELECT id, vehicle_id, vehicle_make, vehicle_model, vehicle_category, quantity, unit_price_cents
         FROM order_items WHERE order_id = ? ORDER BY id`,
      )
      .all(id) as OrderItemRow[];
    return presentOrder(row, items);
  }

  checkout(
    customerId: number,
    idempotencyKey: string,
    requestHash: string,
    cart: CheckoutItem[],
  ): { order: OrderResult; replayed: boolean } {
    const transaction = this.db.transaction(() => {
      const existing = this.db
        .prepare(
          "SELECT id, request_hash FROM orders WHERE customer_id = ? AND idempotency_key = ?",
        )
        .get(customerId, idempotencyKey) as { id: number; request_hash: string } | undefined;
      if (existing) {
        if (existing.request_hash !== requestHash) {
          throw new AppError(409, "This checkout key was already used for a different cart", "IDEMPOTENCY_KEY_REUSED");
        }
        const order = this.readOrder(existing.id);
        if (!order) throw new Error("An idempotent order could not be loaded");
        return { order, replayed: true };
      }

      const vehicles = cart.map((item) => {
        const vehicle = this.db
          .prepare(
            "SELECT id, make, model, category, price_cents, quantity FROM vehicles WHERE id = ?",
          )
          .get(item.vehicleId) as VehicleSnapshot | undefined;
        if (!vehicle) {
          throw new AppError(404, `Vehicle ${item.vehicleId} is no longer available`, "VEHICLE_NOT_FOUND");
        }
        if (vehicle.quantity < item.quantity) {
          throw new AppError(409, `${vehicle.make} ${vehicle.model} does not have enough stock`, "INSUFFICIENT_STOCK");
        }
        return { vehicle, quantity: item.quantity };
      });

      const result = this.db
        .prepare(
          "INSERT INTO orders (customer_id, idempotency_key, request_hash, status) VALUES (?, ?, ?, 'pending')",
        )
        .run(customerId, idempotencyKey, requestHash);
      const orderId = Number(result.lastInsertRowid);
      const decrement = this.db.prepare(
        "UPDATE vehicles SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND quantity >= ?",
      );
      const insertItem = this.db.prepare(
        `INSERT INTO order_items
         (order_id, vehicle_id, vehicle_make, vehicle_model, vehicle_category, quantity, unit_price_cents)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );

      for (const { vehicle, quantity } of vehicles) {
        if (!decrement.run(quantity, vehicle.id, quantity).changes) {
          throw new AppError(409, `${vehicle.make} ${vehicle.model} does not have enough stock`, "INSUFFICIENT_STOCK");
        }
        insertItem.run(
          orderId,
          vehicle.id,
          vehicle.make.trim(),
          vehicle.model.trim(),
          vehicle.category.trim(),
          quantity,
          vehicle.price_cents,
        );
      }
      const order = this.readOrder(orderId);
      if (!order) throw new Error("The new order could not be loaded");
      return { order, replayed: false };
    });
    return transaction.immediate();
  }

  listForCustomer(customerId: number): OrderResult[] {
    const rows = this.db
      .prepare(
        "SELECT id, customer_id, status, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC, id DESC",
      )
      .all(customerId) as OrderRow[];
    return rows.map((row) => this.readOrder(row.id)!).filter(Boolean);
  }

  listAll(): OrderResult[] {
    const rows = this.db
      .prepare(
        `SELECT orders.id, orders.customer_id, orders.status, orders.created_at,
                users.name AS customer_name, users.email AS customer_email
         FROM orders JOIN users ON users.id = orders.customer_id
         ORDER BY orders.created_at DESC, orders.id DESC`,
      )
      .all() as Array<OrderRow & { customer_name: string; customer_email: string }>;
    return rows.map((row) => {
      const order = this.readOrder(row.id)!;
      order.customer = { name: row.customer_name, email: row.customer_email };
      return order;
    });
  }

  cancel(orderId: number, customerId: number): OrderResult {
    const transaction = this.db.transaction(() => {
      const order = this.db
        .prepare("SELECT id, customer_id, status, created_at FROM orders WHERE id = ? AND customer_id = ?")
        .get(orderId, customerId) as OrderRow | undefined;
      if (!order) throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
      if (order.status !== "pending") {
        throw new AppError(409, "Only pending orders can be cancelled", "ORDER_NOT_CANCELLABLE");
      }

      const items = this.db
        .prepare("SELECT vehicle_id, quantity FROM order_items WHERE order_id = ?")
        .all(orderId) as Array<{ vehicle_id: number | null; quantity: number }>;
      const changed = this.db
        .prepare("UPDATE orders SET status = 'cancelled' WHERE id = ? AND customer_id = ? AND status = 'pending'")
        .run(orderId, customerId).changes;
      if (!changed) throw new AppError(409, "Only pending orders can be cancelled", "ORDER_NOT_CANCELLABLE");

      const restore = this.db.prepare(
        "UPDATE vehicles SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND quantity <= ?",
      );
      for (const item of items) {
        if (item.vehicle_id === null || !restore.run(item.quantity, item.vehicle_id, 2147483647 - item.quantity).changes) {
          throw new AppError(409, "Inventory could not be restored for this order", "INVENTORY_RESTORE_FAILED");
        }
      }
      const updated = this.readOrder(orderId);
      if (!updated) throw new Error("The cancelled order could not be loaded");
      return updated;
    });
    return transaction.immediate();
  }

  dashboard() {
    const customers = this.db
      .prepare("SELECT COUNT(*) AS count FROM users JOIN roles ON roles.id = users.role_id WHERE roles.name = 'customer'")
      .get() as { count: number };
    const vehicles = this.db.prepare("SELECT COUNT(*) AS count FROM vehicles").get() as { count: number };
    const orders = this.db.prepare("SELECT COUNT(*) AS count FROM orders").get() as { count: number };
    return { customers: customers.count, vehicles: vehicles.count, orders: orders.count };
  }
}
