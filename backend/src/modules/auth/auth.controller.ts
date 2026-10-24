import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { AppError } from "../../errors/AppError.js";

export function authController(service: AuthService) {
  return {
    register: async (request: Request, response: Response) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) throw new AppError(400, parsed.error.issues[0]?.message ?? "Invalid request", "VALIDATION_ERROR");
      response.status(201).json(await service.register(parsed.data));
    },
    login: async (request: Request, response: Response) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) throw new AppError(400, parsed.error.issues[0]?.message ?? "Invalid request", "VALIDATION_ERROR");
      response.status(200).json(await service.login(parsed.data));
    },
  };
}
