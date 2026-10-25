import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { vehiclesController } from "./vehicles.controller.js";
import { VehiclesService } from "./vehicles.service.js";
import { OrdersService } from "../orders/orders.service.js";

export function createVehiclesRouter(service: VehiclesService, orders: OrdersService, jwtSecret: string): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);
  const controller = vehiclesController(service, orders);
  router.use(auth);
  router.get("/search", controller.list);
  router.get("/", controller.list);
  router.post("/", authorize("admin"), controller.create);
  router.put("/:id", authorize("admin"), controller.update);
  router.delete("/:id", authorize("admin"), controller.remove);
  router.post("/:id/purchase", authorize("customer"), controller.purchase);
  router.post("/:id/restock", authorize("admin"), controller.restock);
  return router;
}
