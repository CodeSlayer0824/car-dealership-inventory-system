import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { AppError } from "../../errors/AppError.js";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

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
    me: (request: Request, response: Response) => {
      if (!request.user) throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
      response.json({ user: service.profile(request.user.id) });
    },
    updateMe: (request: Request, response: Response) => {
      if (!request.user) throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) throw new AppError(400, parsed.error.issues[0]?.message ?? "Invalid name", "VALIDATION_ERROR");
      response.json({ user: service.updateProfileName(request.user.id, parsed.data.name) });
    },
  };
}
