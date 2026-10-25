import { useCallback, useEffect, useState } from "react";
import { ErrorMessage } from "../../components/ErrorMessage";
import { LoadingState } from "../../components/LoadingState";
import type { DashboardStats, Order } from "../../types/order";
import { listAdminOrders, loadAdminDashboard } from "../vehicles/vehiclesApi";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function orderDate(value: string): string {
  const normalized = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(normalized));
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard, history] = await Promise.all([loadAdminDashboard(), listAdminOrders()]);
      setStats(dashboard);
      setOrders(history);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the admin dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
      <p className="eyebrow">DEALERSHIP OVERVIEW</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-ink">Admin dashboard</h1>
      <p className="mt-2 text-sm text-slate-600">A quick view of the current accounts, inventory and customer order history.</p>
      {error && <div className="mt-6"><ErrorMessage message={error} /></div>}
      {loading ? <LoadingState label="Loading dashboard..." /> : stats && (
        <>
          <section aria-label="Inventory statistics" className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              ["Registered customers", stats.customers],
              ["Vehicles in inventory", stats.vehicles],
              ["Total orders", stats.orders],
            ].map(([label, value]) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-ink">{value}</p>
              </article>
            ))}
          </section>
          <section className="mt-10">
            <div className="mb-4">
              <p className="eyebrow">ALL STATUSES INCLUDED</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">Purchase history</h2>
            </div>
            {orders.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No customer orders have been placed.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-bold text-ink">Order #{order.id} · {order.customer?.name}</h3>
                        <p className="mt-1 text-xs text-slate-600">{order.customer?.email} · {orderDate(order.createdAt)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${order.status === "pending" ? "bg-amber-100 text-amber-950" : "bg-slate-100 text-slate-700"}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex flex-wrap justify-between gap-2 py-4 text-sm">
                          <div>
                            <p className="font-semibold text-ink">{item.make} {item.model}</p>
                            <p className="mt-1 text-xs text-slate-600">{item.category} · Quantity {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-ink">{currency.format(item.price)} each</p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
