import type { Request, Response } from "express";
import { AppError } from "../../errors/AppError.js";
import {
  createVehicleSchema,
  restockSchema,
  searchSchema,
  updateVehicleSchema,
} from "./vehicles.schemas.js";
import { VehiclesService } from "./vehicles.service.js";

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

export function vehiclesController(service: VehiclesService) {
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
      response.json({ vehicle: service.purchase(parseId(request.params.id)) });
    },
    restock: (request: Request, response: Response) => {
      const parsed = restockSchema.safeParse(request.body);
      if (!parsed.success) failValidation(parsed.error.issues[0]?.message ?? "Invalid restock quantity");
      response.json({ vehicle: service.restock(parseId(request.params.id), parsed.data.quantity) });
    },
  };
}
