import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "../../components/ErrorMessage";
import { LoadingState } from "../../components/LoadingState";
import type { Order } from "../../types/order";
import { cancelOrder, listMyOrders } from "../vehicles/vehiclesApi";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function orderDate(value: string): string {
  const normalized = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(normalized));
}

export function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await listMyOrders());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(order: Order) {
    setCancelling(order.id);
    setError("");
    setNotice("");
    try {
      const updated = await cancelOrder(order.id);
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`Order #${updated.id} was cancelled and its stock returned to inventory.`);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel this order");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-12">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-ink">My orders</h1>
      <p className="mt-2 text-sm text-slate-600">Review your confirmed orders and cancel those that are still pending.</p>
      <div className="mt-7">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
        {notice && <p className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-950" role="status">{notice}</p>}
        {loading ? <LoadingState label="Loading your orders..." /> : orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-card">
            <h2 className="text-lg font-bold text-ink">No orders yet</h2>
            <p className="mt-2 text-sm text-slate-600">Confirmed orders will appear here.</p>
            <Link className="button-primary mt-5 inline-flex" to="/inventory">Browse inventory</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="font-bold text-ink">Order #{order.id}</h2>
                    <p className="mt-1 text-xs text-slate-600">{orderDate(order.createdAt)}</p>
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
                      <p className="font-semibold text-ink">{currency.format(item.price * item.quantity)} <span className="font-normal text-slate-600">({currency.format(item.price)} each)</span></p>
                    </div>
                  ))}
                </div>
                {order.status === "pending" && (
                  <button
                    className="button-secondary mt-3 text-rose-900 hover:border-rose-300 hover:text-rose-900"
                    type="button"
                    disabled={cancelling === order.id}
                    onClick={() => void cancel(order)}
                  >
                    {cancelling === order.id ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
