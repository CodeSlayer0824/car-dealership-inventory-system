import express, { type Express, type RequestHandler } from "express";
import cors from "cors";
import type Database from "better-sqlite3";
import { AppError } from "./errors/AppError.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { AuthRepository } from "./modules/auth/auth.repository.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { createVehiclesRouter } from "./modules/vehicles/vehicles.routes.js";
import { VehiclesRepository } from "./modules/vehicles/vehicles.repository.js";
import { VehiclesService } from "./modules/vehicles/vehicles.service.js";

interface AppOptions {
  db: Database.Database;
  jwtSecret: string;
  frontendOrigin?: string;
}

const notFound: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, "Route not found", "ROUTE_NOT_FOUND"));
};

export function createApp(options: AppOptions): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: options.frontendOrigin ?? "http://localhost:5173" }));
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
  app.use(
    "/api/auth",
    createAuthRouter(new AuthService(new AuthRepository(options.db), options.jwtSecret)),
  );
  app.use(
    "/api/vehicles",
    createVehiclesRouter(new VehiclesService(new VehiclesRepository(options.db)), options.jwtSecret),
  );
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
