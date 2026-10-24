import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { vehiclesController } from "./vehicles.controller.js";
import { VehiclesService } from "./vehicles.service.js";

export function createVehiclesRouter(service: VehiclesService, jwtSecret: string): Router {
  const router = Router();
  const auth = authenticate(jwtSecret);
  const controller = vehiclesController(service);
  router.use(auth);
  router.get("/search", controller.list);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", authorize("admin"), controller.remove);
  router.post("/:id/purchase", controller.purchase);
  router.post("/:id/restock", authorize("admin"), controller.restock);
  return router;
}
