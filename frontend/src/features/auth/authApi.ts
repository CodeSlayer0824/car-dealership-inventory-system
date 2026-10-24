import { apiRequest } from "../../lib/apiClient";
import type { AuthResponse } from "../../types/auth";

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest("/auth/login", {
    method: "POST",
    authenticated: false,
    body: { email, password },
  });
}

export function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiRequest("/auth/register", {
    method: "POST",
    authenticated: false,
    body: { name, email, password },
  });
}
