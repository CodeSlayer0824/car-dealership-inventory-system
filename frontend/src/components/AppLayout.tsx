import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-white/10 bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link to="/inventory" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-sm font-black tracking-tight">N</span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.16em]">Northstar</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Motor Company</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <NavLink to="/inventory" className={({ isActive }) => `text-sm font-semibold ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`}>Inventory</NavLink>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">{user?.role}</p>
            </div>
            <button
              className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold transition hover:bg-white/10"
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
      <Outlet />
    </div>
  );
}
