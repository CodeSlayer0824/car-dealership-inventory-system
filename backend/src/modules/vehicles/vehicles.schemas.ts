import { z } from "zod";

const money = z.number().finite().min(0).max(999999999.99)
  .refine((value) => Number.isInteger(value * 100), "Price supports at most two decimal places");
const quantity = z.number().int().min(0).max(2147483647);

export const createVehicleSchema = z.object({
  make: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(80),
  price: money,
  quantity,
});

export const updateVehicleSchema = createVehicleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one vehicle field must be provided",
);

export const restockSchema = z.object({
  quantity: z.number().int().positive().max(2147483647),
});

export const searchSchema = z.object({
  make: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  minPrice: z.coerce.number().finite().min(0).optional(),
  maxPrice: z.coerce.number().finite().min(0).optional(),
}).refine(
  (value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice,
  "Minimum price must not exceed maximum price",
);

export function toPriceCents(price: number): number {
  return Math.round(price * 100);
}
