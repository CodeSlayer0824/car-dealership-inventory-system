import type { Request, Response } from "express";
import { AppError } from "../../errors/AppError.js";
import {
  createVehicleSchema,
  restockSchema,
  searchSchema,
  updateVehicleSchema,
} from "./vehicles.schemas.js";
import { VehiclesService } from "./vehicles.service.js";
import { OrdersService } from "../orders/orders.service.js";
import { idempotencyKeySchema } from "../orders/orders.schemas.js";

function parseId(value: string | string[] | undefined): number {
  if (typeof value !== "string") {
    throw new AppError(400, "Vehicle ID must be a positive integer", "VALIDATION_ERROR");
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError(400, "Vehicle ID must be a positive integer", "VALIDATION_ERROR");
  }
  return id;
}

function failValidation(message: string): never {
  throw new AppError(400, message, "VALIDATION_ERROR");
}

export function vehiclesController(service: VehiclesService, orders: OrdersService) {
  return {
    list: (request: Request, response: Response) => {
      const parsed = searchSchema.safeParse(request.query);
      if (!parsed.success) failValidation(parsed.error.issues[0]?.message ?? "Invalid search filters");
      response.json({ vehicles: service.list(parsed.data) });
    },
    create: (request: Request, response: Response) => {
      const parsed = createVehicleSchema.safeParse(request.body);
      if (!parsed.success) failValidation(parsed.error.issues[0]?.message ?? "Invalid vehicle");
      response.status(201).json({ vehicle: service.create(parsed.data) });
    },
    update: (request: Request, response: Response) => {
      const parsed = updateVehicleSchema.safeParse(request.body);
      if (!parsed.success) failValidation(parsed.error.issues[0]?.message ?? "Invalid vehicle");
      response.json({ vehicle: service.update(parseId(request.params.id), parsed.data) });
    },
    remove: (request: Request, response: Response) => {
      service.delete(parseId(request.params.id));
      response.status(204).end();
    },
    purchase: (request: Request, response: Response) => {
      if (!request.user) throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
      const vehicleId = parseId(request.params.id);
      const idempotencyKey = idempotencyKeySchema.safeParse(request.header("Idempotency-Key"));
      if (!idempotencyKey.success) {
        throw new AppError(400, "A valid Idempotency-Key header is required", "VALIDATION_ERROR");
      }
      const result = orders.checkout(request.user.id, idempotencyKey.data, [{ vehicleId, quantity: 1 }]);
      response.status(result.replayed ? 200 : 201).json({
        vehicle: service.getById(vehicleId),
        order: result.order,
      });
    },
    restock: (request: Request, response: Response) => {
      const parsed = restockSchema.safeParse(request.body);
      if (!parsed.success) failValidation(parsed.error.issues[0]?.message ?? "Invalid restock quantity");
      response.json({ vehicle: service.restock(parseId(request.params.id), parsed.data.quantity) });
    },
  };
}
