export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin";
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
