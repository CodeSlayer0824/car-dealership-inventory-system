import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { verifyToken } from "../modules/auth/token.js";

export function authenticate(jwtSecret: string): RequestHandler {
  return (request, _response, next) => {
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
      return;
    }
    try {
      request.user = verifyToken(authorization.slice(7), jwtSecret);
      next();
    } catch {
      next(new AppError(401, "Invalid or expired token", "UNAUTHENTICATED"));
    }
  };
}
