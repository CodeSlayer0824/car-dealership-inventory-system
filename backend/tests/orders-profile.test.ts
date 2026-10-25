import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import type Database from "better-sqlite3";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/db/connection.js";
import { signToken } from "../src/modules/auth/token.js";

describe("orders, customer profile, and admin dashboard", () => {
  let app: Express;
  let db: Database.Database;
  let customerToken: string;
  let otherCustomerToken: string;
  let adminToken: string;

  beforeEach(() => {
    db = createDatabase(":memory:");
    db.prepare(
      "INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)",
    ).run(
      "Customer", "customer@example.com", "unused", 1,
      "Other Customer", "other@example.com", "unused", 1,
      "Admin", "admin@example.com", "unused", 2,
    );
    customerToken = signToken({ id: 1, role: "customer" }, "test-secret");
    otherCustomerToken = signToken({ id: 2, role: "customer" }, "test-secret");
    adminToken = signToken({ id: 3, role: "admin" }, "test-secret");
    app = createApp({ db, jwtSecret: "test-secret" });
  });

  afterEach(() => db.close());

  async function addVehicle(quantity = 4, price = 15000) {
    const response = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ make: " Toyota ", model: "Corolla", category: "SUV", price, quantity });
    return response;
  }

  it("rejects admin inventory changes from customers and duplicate normalized vehicles", async () => {
    const first = await addVehicle();
    expect(first.status).toBe(201);

    const duplicate = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ make: "toyota", model: " Corolla ", category: "suv", price: 15000, quantity: 9 });
    expect(duplicate.status).toBe(409);

    const customerCreate = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ make: "Honda", model: "Civic", category: "Sedan", price: 20000, quantity: 1 });
    expect(customerCreate.status).toBe(403);

    const customerUpdate = await request(app)
      .put(`/api/vehicles/${first.body.vehicle.id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ price: 17000 });
    expect(customerUpdate.status).toBe(403);
  });

  it("checks out atomically, snapshots the price, and returns the same order for a retry", async () => {
    const created = await addVehicle(3, 15000);
    const vehicleId = created.body.vehicle.id as number;
    const key = "checkout-attempt-0001";
    const checkout = () => request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", key)
      .send({ items: [{ vehicleId, quantity: 2 }] });

    const first = await checkout();
    expect(first.status).toBe(201);
    expect(first.body.order).toMatchObject({
      customerId: 1,
      status: "pending",
      items: [{ vehicleId, quantity: 2, price: 15000, make: "Toyota" }],
    });
    expect(db.prepare("SELECT quantity FROM vehicles WHERE id = ?").get(vehicleId)).toEqual({ quantity: 1 });

    db.prepare("UPDATE vehicles SET price_cents = ? WHERE id = ?").run(2000000, vehicleId);
    const retry = await checkout();
    expect(retry.status).toBe(200);
    expect(retry.body.order.id).toBe(first.body.order.id);
    expect(retry.body.order.items[0].price).toBe(15000);
    expect(db.prepare("SELECT quantity FROM vehicles WHERE id = ?").get(vehicleId)).toEqual({ quantity: 1 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM orders").get()).toEqual({ count: 1 });
  });

  it("rejects insufficient stock without creating an order or partially changing inventory", async () => {
    const first = await addVehicle(2, 10000);
    const second = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ make: "Honda", model: "Civic", category: "Sedan", price: 12000, quantity: 1 });
    const response = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "insufficient-stock-0001")
      .send({
        items: [
          { vehicleId: first.body.vehicle.id, quantity: 1 },
          { vehicleId: second.body.vehicle.id, quantity: 2 },
        ],
      });

    expect(response.status).toBe(409);
    expect(db.prepare("SELECT COUNT(*) AS count FROM orders").get()).toEqual({ count: 0 });
    expect(db.prepare("SELECT quantity FROM vehicles WHERE id = ?").get(first.body.vehicle.id)).toEqual({ quantity: 2 });
  });

  it("does not oversell when customers check out concurrently", async () => {
    const vehicle = await addVehicle(1, 11000);
    const makeCheckout = (key: string) => request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", key)
      .send({ items: [{ vehicleId: vehicle.body.vehicle.id, quantity: 1 }] });
    const results = await Promise.all([
      makeCheckout("parallel-checkout-0001"),
      makeCheckout("parallel-checkout-0002"),
    ]);

    expect(results.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(db.prepare("SELECT quantity FROM vehicles WHERE id = ?").get(vehicle.body.vehicle.id)).toEqual({ quantity: 0 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM orders").get()).toEqual({ count: 1 });
  });

  it("prevents admins from checking out and an idempotency key from being reused for a different cart", async () => {
    const vehicle = await addVehicle();
    const path = "/api/orders/checkout";
    const key = "same-key-attempt-0001";

    const denied = await request(app)
      .post(path)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("Idempotency-Key", key)
      .send({ items: [{ vehicleId: vehicle.body.vehicle.id, quantity: 1 }] });
    expect(denied.status).toBe(403);

    const first = await request(app)
      .post(path)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", key)
      .send({ items: [{ vehicleId: vehicle.body.vehicle.id, quantity: 1 }] });
    expect(first.status).toBe(201);

    const changed = await request(app)
      .post(path)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", key)
      .send({ items: [{ vehicleId: vehicle.body.vehicle.id, quantity: 2 }] });
    expect(changed.status).toBe(409);
    expect(db.prepare("SELECT quantity FROM vehicles WHERE id = ?").get(vehicle.body.vehicle.id)).toEqual({ quantity: 3 });
  });

  it("lists only a customer's orders, rejects other-owner cancellation, and restores stock once", async () => {
    const vehicle = await addVehicle(3, 9000);
    const checkout = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "customer-order-0001")
      .send({ items: [{ vehicleId: vehicle.body.vehicle.id, quantity: 2 }] });
    const orderId = checkout.body.order.id as number;

    const otherHistory = await request(app)
      .get("/api/orders/mine")
      .set("Authorization", `Bearer ${otherCustomerToken}`);
    expect(otherHistory.status).toBe(200);
    expect(otherHistory.body.orders).toHaveLength(0);

    const denied = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${otherCustomerToken}`);
    expect(denied.status).toBe(404);
    expect(db.prepare("SELECT quantity FROM vehicles WHERE id = ?").get(vehicle.body.vehicle.id)).toEqual({ quantity: 1 });

    const cancellations = await Promise.all([
      request(app).post(`/api/orders/${orderId}/cancel`).set("Authorization", `Bearer ${customerToken}`),
      request(app).post(`/api/orders/${orderId}/cancel`).set("Authorization", `Bearer ${customerToken}`),
    ]);
    expect(cancellations.map((response) => response.status).sort()).toEqual([200, 409]);
    const cancelled = cancellations.find((response) => response.status === 200)!;
    expect(cancelled.body.order.status).toBe("cancelled");
    expect(cancelled.body.order.items[0].quantity).toBe(2);
    expect(db.prepare("SELECT quantity FROM vehicles WHERE id = ?").get(vehicle.body.vehicle.id)).toEqual({ quantity: 3 });
    const adminHistory = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminHistory.body.orders[0].status).toBe("cancelled");

    const repeated = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(repeated.status).toBe(409);
    expect(db.prepare("SELECT quantity FROM vehicles WHERE id = ?").get(vehicle.body.vehicle.id)).toEqual({ quantity: 3 });
  });

  it("prevents deleting a vehicle with a pending order and keeps snapshots after deletion", async () => {
    const vehicle = await addVehicle(2, 7500);
    const checkout = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "pending-delete-order-001")
      .send({ items: [{ vehicleId: vehicle.body.vehicle.id, quantity: 1 }] });
    const orderId = checkout.body.order.id as number;

    const blocked = await request(app)
      .delete(`/api/vehicles/${vehicle.body.vehicle.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(blocked.status).toBe(409);

    await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);
    const deleted = await request(app)
      .delete(`/api/vehicles/${vehicle.body.vehicle.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleted.status).toBe(204);

    const history = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(history.body.orders[0].items[0]).toMatchObject({
      vehicleId: null,
      make: "Toyota",
      model: "Corolla",
      price: 7500,
    });
  });

  it("provides admin purchase history and accurate dashboard counts", async () => {
    const vehicle = await addVehicle(5, 13000);
    const checkout = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "admin-history-order-001")
      .send({ items: [{ vehicleId: vehicle.body.vehicle.id, quantity: 1 }] });
    const orderId = checkout.body.order.id as number;

    const customerStats = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(customerStats.status).toBe(403);

    const stats = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(stats.status).toBe(200);
    expect(stats.body).toEqual({ customers: 2, vehicles: 1, orders: 1 });

    const adminOrders = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminOrders.status).toBe(200);
    expect(adminOrders.body.orders[0]).toMatchObject({
      id: orderId,
      customer: { email: "customer@example.com" },
      status: "pending",
      items: [{ make: "Toyota", quantity: 1, price: 13000 }],
    });
    expect((await request(app).get("/api/admin/orders").set("Authorization", `Bearer ${customerToken}`)).status).toBe(403);
  });

  it("allows customers to update only their own profile name", async () => {
    const updated = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Updated Customer" });
    expect(updated.status).toBe(200);
    expect(updated.body.user.name).toBe("Updated Customer");

    const stored = db.prepare("SELECT name FROM users WHERE id = 1").get();
    expect(stored).toEqual({ name: "Updated Customer" });
    expect((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${customerToken}`)).body.user.name)
      .toBe("Updated Customer");
    expect((await request(app).patch("/api/auth/me").set("Authorization", `Bearer ${customerToken}`).send({ name: "  " })).status)
      .toBe(400);
  });
});
