import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }
  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    response.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body must contain valid JSON" },
    });
    return;
  }
  if (typeof error === "object" && error !== null && "status" in error && error.status === 413) {
    response.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds the 100 KB limit" },
    });
    return;
  }
  console.error("Unhandled request error", error);
  response.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
  });
};
