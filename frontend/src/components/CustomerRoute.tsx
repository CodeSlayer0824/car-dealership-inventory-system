import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

export function CustomerRoute() {
  const { user } = useAuth();
  return user?.role === "customer" ? <Outlet /> : <Navigate to="/inventory" replace />;
}
