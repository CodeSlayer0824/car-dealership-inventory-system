import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { ordersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";

export function createOrdersRouter(service: OrdersService, jwtSecret: string): Router {
  const router = Router();
  const controller = ordersController(service);
  router.use(authenticate(jwtSecret));
  router.post("/checkout", authorize("customer"), controller.checkout);
  router.get("/mine", authorize("customer"), controller.myOrders);
  router.post("/:id/cancel", authorize("customer"), controller.cancel);
  return router;
}

export function createAdminRouter(service: OrdersService, jwtSecret: string): Router {
  const router = Router();
  const controller = ordersController(service);
  router.use(authenticate(jwtSecret), authorize("admin"));
  router.get("/dashboard", controller.dashboard);
  router.get("/orders", controller.allOrders);
  return router;
}
