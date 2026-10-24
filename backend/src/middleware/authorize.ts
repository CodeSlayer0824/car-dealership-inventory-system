import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export function authorize(...roles: string[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      next(new AppError(403, "You do not have permission to perform this action", "FORBIDDEN"));
      return;
    }
    next();
  };
}
