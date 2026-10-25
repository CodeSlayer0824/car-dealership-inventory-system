import { z } from "zod";

export const checkoutSchema = z.object({
  items: z.array(
    z.object({
      vehicleId: z.number().int().positive(),
      quantity: z.number().int().positive().max(2147483647),
    }),
  ).min(1).max(50).refine(
    (items) => new Set(items.map((item) => item.vehicleId)).size === items.length,
    "A vehicle can appear only once in the cart",
  ),
});

export const orderIdSchema = z.coerce.number().int().positive();

export const idempotencyKeySchema = z.string().trim().min(12).max(128);
