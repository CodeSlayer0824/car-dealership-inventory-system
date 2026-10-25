import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { useCart } from "../features/cart/CartProvider";
import { SiteFooter } from "./SiteFooter";

export function AppLayout() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${
      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-white/10 bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-5 sm:py-4 lg:px-8">
          <Link to="/inventory" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-sm font-black tracking-tight">H</span>
            <span className="block text-sm font-black uppercase tracking-[0.16em]">Hegde Motors</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/inventory" className={linkClass}>Inventory</NavLink>
            {user?.role === "customer" && (
              <>
                <NavLink to="/cart" className={linkClass} aria-label={`Cart, ${cart.itemCount} items`}>
                  Cart{cart.itemCount > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-white">{cart.itemCount}</span>}
                </NavLink>
                <NavLink to="/orders" className={linkClass}>Orders</NavLink>
              </>
            )}
            {user?.role === "admin" && <NavLink to="/admin" className={linkClass}>Dashboard</NavLink>}
            <NavLink to="/profile" className={linkClass}>Profile</NavLink>
            <div className="hidden min-w-24 text-right sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">{user?.role}</p>
            </div>
            <button
              className="min-h-10 rounded-lg border border-white/30 px-2.5 py-2 text-xs font-bold text-white transition hover:border-white hover:bg-white/10 sm:px-3"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  );
}
