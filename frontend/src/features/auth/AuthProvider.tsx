import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { clearSession, loadSession, saveSession } from "../../lib/authStorage";
import type { AuthResponse, AuthUser } from "../../types/auth";
import * as authApi from "./authApi";

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persist(response: AuthResponse, setUser: (user: AuthUser) => void): void {
  saveSession(response);
  setUser(response.user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession()?.user ?? null);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(email, password) {
        persist(await authApi.login(email, password), setUser);
      },
      async register(name, email, password) {
        persist(await authApi.register(name, email, password), setUser);
      },
      logout() {
        clearSession();
        setUser(null);
      },
    }),
    [user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
