import { Router } from "express";
import { authController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

export function createAuthRouter(service: AuthService): Router {
  const router = Router();
  const controller = authController(service);
  router.post("/register", controller.register);
  router.post("/login", controller.login);
  return router;
}
