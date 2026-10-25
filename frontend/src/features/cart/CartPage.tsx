import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "../../components/ErrorMessage";
import { LoadingState } from "../../components/LoadingState";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "./CartProvider";
import type { Vehicle } from "../../types/vehicle";
import { checkoutOrder, listVehicles } from "../vehicles/vehiclesApi";
import { cartLineTotal, vehicleImageForCategory } from "./cartUtils";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function CartPage() {
  const { user } = useAuth();
  const cart = useCart();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setVehicles(await listVehicles());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const vehiclesById = useMemo(() => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])), [vehicles]);
  const valid = cart.lines.length > 0 && cart.lines.every((line) => {
    const vehicle = vehiclesById.get(line.vehicleId);
    return vehicle !== undefined && line.quantity > 0 && line.quantity <= vehicle.quantity;
  });
  const subtotalCents = cart.lines.reduce((total, line) => total + cartLineTotal(line, vehiclesById), 0);

  async function checkout() {
    if (!user || !valid || checkingOut) return;
    setCheckingOut(true);
    setError("");
    setNotice("");
    const keyName = `dealership.checkout.${user.id}`;
    const attemptKey = localStorage.getItem(keyName) ?? crypto.randomUUID();
    localStorage.setItem(keyName, attemptKey);
    try {
      const order = await checkoutOrder(cart.lines, attemptKey);
      cart.clear();
      setNotice(`Order #${order.id} is confirmed. Payment is not collected in this demo.`);
      await load();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be completed. Your cart is unchanged.");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">
      <p className="eyebrow">YOUR SELECTION</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-ink">Shopping cart</h1>
      <p className="mt-2 text-sm text-slate-600">Review your vehicles and confirm your order. No payment is processed here.</p>
      <div className="mt-7">
        {error && <div className="mb-5"><ErrorMessage message={error} /></div>}
        {notice && <p className="mb-5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950" role="status">{notice}</p>}
        {loading ? <LoadingState label="Loading your cart..." /> : cart.lines.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-card">
            <h2 className="text-xl font-bold text-ink">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-600">Browse the collection and add a vehicle to get started.</p>
            <Link className="button-primary mt-5 inline-flex items-center" to="/inventory">Browse inventory</Link>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
            <section aria-label="Cart items" className="space-y-4">
              {cart.lines.map((line) => {
                const vehicle = vehiclesById.get(line.vehicleId);
                const unavailable = !vehicle;
                const exceedsStock = vehicle !== undefined && line.quantity > vehicle.quantity;
                return (
                  <article key={line.vehicleId} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-[180px_1fr] sm:p-5">
                    {vehicle ? (
                      <img
                        className="h-36 w-full rounded-xl object-cover sm:h-full sm:min-h-36"
                        src={vehicleImageForCategory(vehicle.category)}
                        alt={`${vehicle.category} vehicle reference`}
                      />
                    ) : (
                      <div className="grid min-h-32 place-items-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">Unavailable</div>
                    )}
                    <div className="flex flex-col justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{vehicle?.make ?? "Removed from inventory"}</p>
                        <h2 className="mt-1 text-lg font-bold text-ink">{vehicle?.model ?? `Vehicle #${line.vehicleId}`}</h2>
                        {vehicle && <p className="mt-1 text-sm text-slate-600">{vehicle.category} · {currency.format(vehicle.price)} each</p>}
                        {unavailable && <p className="mt-2 text-sm text-rose-800">This vehicle is no longer available. Remove it before checkout.</p>}
                        {exceedsStock && <p className="mt-2 text-sm text-rose-800">Only {vehicle.quantity} currently available. Lower the quantity to continue.</p>}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="quantity-button"
                            aria-label={`Decrease ${vehicle?.model ?? "vehicle"} quantity`}
                            disabled={line.quantity <= 1 || !vehicle}
                            onClick={() => vehicle && cart.setQuantity(line.vehicleId, line.quantity - 1, vehicle.quantity)}
                          >−</button>
                          <span className="min-w-8 text-center font-bold text-ink" aria-label="Quantity">{line.quantity}</span>
                          <button
                            type="button"
                            className="quantity-button"
                            aria-label={`Increase ${vehicle?.model ?? "vehicle"} quantity`}
                            disabled={!vehicle || line.quantity >= vehicle.quantity}
                            onClick={() => vehicle && cart.setQuantity(line.vehicleId, line.quantity + 1, vehicle.quantity)}
                          >+</button>
                          <button className="ml-2 text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-rose-800" type="button" onClick={() => cart.remove(line.vehicleId)}>Remove</button>
                        </div>
                        <p className="font-bold text-ink">{vehicle ? currency.format(vehicle.price * line.quantity) : "—"}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:sticky lg:top-6">
              <h2 className="text-lg font-bold text-ink">Order summary</h2>
              <div className="mt-4 flex justify-between border-b border-slate-100 pb-4 text-sm text-slate-700">
                <span>Subtotal</span><span className="font-semibold text-ink">{currency.format(subtotalCents / 100)}</span>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-600">Stock is checked again when the order is confirmed. Final price is recorded at checkout.</p>
              <button
                className="button-primary mt-5 w-full"
                type="button"
                disabled={!valid || checkingOut}
                onClick={() => void checkout()}
              >
                {checkingOut ? "Confirming order..." : "Confirm order"}
              </button>
              <Link className="mt-4 block text-center text-sm font-semibold text-slate-700 underline underline-offset-4" to="/inventory">Continue browsing</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
