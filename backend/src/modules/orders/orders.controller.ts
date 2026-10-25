import type { Request, Response } from "express";
import { AppError } from "../../errors/AppError.js";
import { checkoutSchema, idempotencyKeySchema, orderIdSchema } from "./orders.schemas.js";
import { OrdersService } from "./orders.service.js";

function currentUserId(request: Request): number {
  if (!request.user) throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
  return request.user.id;
}

function parseOrderId(value: string | string[] | undefined): number {
  const parsed = orderIdSchema.safeParse(value);
  if (!parsed.success) throw new AppError(400, "Order ID must be a positive integer", "VALIDATION_ERROR");
  return parsed.data;
}

export function ordersController(service: OrdersService) {
  return {
    checkout: (request: Request, response: Response) => {
      const idempotencyKey = idempotencyKeySchema.safeParse(request.header("Idempotency-Key"));
      if (!idempotencyKey.success) {
        throw new AppError(400, "A valid Idempotency-Key header is required", "VALIDATION_ERROR");
      }
      const cart = checkoutSchema.safeParse(request.body);
      if (!cart.success) {
        throw new AppError(400, cart.error.issues[0]?.message ?? "Invalid cart", "VALIDATION_ERROR");
      }
      const result = service.checkout(currentUserId(request), idempotencyKey.data, cart.data.items);
      response.status(result.replayed ? 200 : 201).json({ order: result.order });
    },
    myOrders: (request: Request, response: Response) => {
      response.json({ orders: service.customerOrders(currentUserId(request)) });
    },
    cancel: (request: Request, response: Response) => {
      response.json({
        order: service.cancel(parseOrderId(request.params.id), currentUserId(request)),
      });
    },
    dashboard: (_request: Request, response: Response) => {
      response.json(service.dashboard());
    },
    allOrders: (_request: Request, response: Response) => {
      response.json({ orders: service.adminOrders() });
    },
  };
}
