import type { AuthUser } from "../types/auth";

const TOKEN_KEY = "dealership.token";
const USER_KEY = "dealership.user";

export interface SavedSession {
  token: string;
  user: AuthUser;
}

export function loadSession(): SavedSession | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  if (!token || !rawUser) return null;
  try {
    const user: unknown = JSON.parse(rawUser);
    if (
      typeof user === "object" &&
      user !== null &&
      "id" in user &&
      typeof user.id === "number" &&
      "name" in user &&
      typeof user.name === "string" &&
      "email" in user &&
      typeof user.email === "string" &&
      "role" in user &&
      (user.role === "admin" || user.role === "customer")
    ) {
      return { token, user: user as AuthUser };
    }
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  return null;
}

export function saveSession(session: SavedSession): void {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
