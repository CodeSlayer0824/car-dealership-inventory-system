import { Router } from "express";
import { authController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { authenticate } from "../../middleware/authenticate.js";

export function createAuthRouter(service: AuthService, jwtSecret: string): Router {
  const router = Router();
  const controller = authController(service);
  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.get("/me", authenticate(jwtSecret), controller.me);
  router.patch("/me", authenticate(jwtSecret), controller.updateMe);
  return router;
}
