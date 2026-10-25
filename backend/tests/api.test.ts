import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import type Database from "better-sqlite3";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/db/connection.js";
import { hashPassword } from "../src/modules/auth/password.js";
import { signToken } from "../src/modules/auth/token.js";

describe("Car dealership API", () => {
  let app: Express;
  let db: Database.Database;
  let customerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    db = createDatabase(":memory:");
    db.exec(`
      INSERT INTO users (name, email, password_hash, role_id, created_at, updated_at)
      VALUES ('Customer', 'customer@example.com', 'unused', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `);
    const adminHash = await hashPassword("Admin-password-123!");
    db.prepare(
      "INSERT INTO users (name, email, password_hash, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    ).run("Admin", "admin@example.com", adminHash, 2);
    customerToken = signToken({ id: 1, role: "customer" }, "test-secret");
    adminToken = signToken({ id: 2, role: "admin" }, "test-secret");
    app = createApp({ db, jwtSecret: "test-secret" });
  });

  afterEach(() => db.close());

  it("registers and authenticates customers without exposing their password", async () => {
    const registration = await request(app).post("/api/auth/register").send({
      name: "New Customer",
      email: "NEW@example.com",
      password: "Strong-password-123!",
      role: "admin",
    });
    expect(registration.status).toBe(201);
    expect(registration.body.user).toMatchObject({
      name: "New Customer",
      email: "new@example.com",
      role: "customer",
    });
    expect(registration.body.user.password_hash).toBeUndefined();
    expect(registration.body.token).toEqual(expect.any(String));

    const login = await request(app).post("/api/auth/login").send({
      email: "new@example.com",
      password: "Strong-password-123!",
    });
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
  });

  it("rejects duplicate registrations and invalid login credentials", async () => {
    const duplicate = await request(app).post("/api/auth/register").send({
      name: "Another",
      email: "CUSTOMER@example.com",
      password: "Strong-password-123!",
    });
    expect(duplicate.status).toBe(409);

    const invalid = await request(app).post("/api/auth/login").send({
      email: "customer@example.com",
      password: "wrong-password",
    });
    expect(invalid.status).toBe(401);
  });

  it("requires a bearer token for inventory endpoints", async () => {
    const response = await request(app).get("/api/vehicles");
    expect(response.status).toBe(401);
  });

  it("returns a client error for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_JSON");
  });

  it("allows admins to manage vehicles and customers to search and purchase", async () => {
    const created = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ make: "Toyota", model: "Corolla", category: "Sedan", price: 24500, quantity: 2 });
    expect(created.status).toBe(201);
    const id = created.body.vehicle.id as number;

    const updated = await request(app)
      .put(`/api/vehicles/${id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 23999, quantity: 2 });
    expect(updated.status).toBe(200);
    expect(updated.body.vehicle.price).toBe(23999);

    const search = await request(app)
      .get("/api/vehicles?make=toyota&category=Sedan&minPrice=20000&maxPrice=25000")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(search.status).toBe(200);
    expect(search.body.vehicles).toHaveLength(1);

    const purchase = await request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("Idempotency-Key", "legacy-purchase-0001");
    expect(purchase.status).toBe(201);
    expect(purchase.body.vehicle.quantity).toBe(1);
    expect(purchase.body.order.status).toBe("pending");
  });

  it("prevents purchasing out-of-stock vehicles and restricts admin actions", async () => {
    const created = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ make: "Honda", model: "Civic", category: "Sedan", price: 26000, quantity: 1 });
    const id = created.body.vehicle.id as number;

    const purchases = await Promise.all([
      request(app)
        .post(`/api/vehicles/${id}/purchase`)
        .set("Authorization", `Bearer ${customerToken}`)
        .set("Idempotency-Key", "parallel-purchase-0001"),
      request(app)
        .post(`/api/vehicles/${id}/purchase`)
        .set("Authorization", `Bearer ${customerToken}`)
        .set("Idempotency-Key", "parallel-purchase-0002"),
    ]);
    expect(purchases.map((response) => response.status).sort()).toEqual([201, 409]);

    const customerRestock = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ quantity: 3 });
    expect(customerRestock.status).toBe(403);

    const adminRestock = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 3 });
    expect(adminRestock.status).toBe(200);
    expect(adminRestock.body.vehicle.quantity).toBe(3);
  });

  it("allows only admins to delete vehicles", async () => {
    const created = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ make: "Ford", model: "Focus", category: "Hatchback", price: 18000, quantity: 1 });
    const id = created.body.vehicle.id as number;

    const denied = await request(app)
      .delete(`/api/vehicles/${id}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(denied.status).toBe(403);

    const deleted = await request(app)
      .delete(`/api/vehicles/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleted.status).toBe(204);
  });
});
