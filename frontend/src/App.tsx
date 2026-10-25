import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./components/AdminRoute";
import { AppLayout } from "./components/AppLayout";
import { CustomerRoute } from "./components/CustomerRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { ProfilePage } from "./features/auth/ProfilePage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { CartProvider } from "./features/cart/CartProvider";
import { CartPage } from "./features/cart/CartPage";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { MyOrdersPage } from "./features/orders/MyOrdersPage";
import { InventoryPage } from "./features/vehicles/InventoryPage";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route element={<CustomerRoute />}>
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/orders" element={<MyOrdersPage />} />
                </Route>
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/inventory" replace />} />
          </Routes>
        </CartProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
