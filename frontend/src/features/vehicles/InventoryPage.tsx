import { useCallback, useEffect, useState } from "react";
import { ErrorMessage } from "../../components/ErrorMessage";
import { LoadingState } from "../../components/LoadingState";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/CartProvider";
import type { Vehicle, VehicleFilters, VehicleInput } from "../../types/vehicle";
import { vehicleImageForCategory } from "../cart/cartUtils";
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  restockVehicle,
  updateVehicle,
} from "./vehiclesApi";
import { VehicleCard } from "./VehicleCard";
import { VehicleForm } from "./VehicleForm";
import { VehicleSearch } from "./VehicleSearch";

function StockControls({
  vehicle,
  onRestock,
}: {
  vehicle: Vehicle;
  onRestock: (vehicle: Vehicle, quantity: number) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          await onRestock(vehicle, Number(quantity));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="sr-only" htmlFor={`restock-${vehicle.id}`}>Restock quantity</label>
      <input
        id={`restock-${vehicle.id}`}
        className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
        type="number"
        min="1"
        step="1"
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
      />
      <button className="text-xs font-bold text-ink underline decoration-accent underline-offset-4" disabled={busy} type="submit">
        {busy ? "Restocking..." : "Restock"}
      </button>
    </form>
  );
}

export function InventoryPage() {
  const { user } = useAuth();
  const cart = useCart();
  const isAdmin = user?.role === "admin";
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async (activeFilters: VehicleFilters) => {
    setLoading(true);
    setError("");
    try {
      setVehicles(await listVehicles(activeFilters));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filters);
  }, [filters, load]);

  function addToCart(vehicle: Vehicle) {
    setError("");
    setNotice("");
    try {
      cart.add(vehicle.id, vehicle.quantity);
      setNotice(`${vehicle.make} ${vehicle.model} added to your cart.`);
    } catch (cartError) {
      setError(cartError instanceof Error ? cartError.message : "Unable to add vehicle to cart");
    }
  }

  async function saveVehicle(input: VehicleInput) {
    if (editing) {
      await updateVehicle(editing.id, input);
    } else {
      await createVehicle(input);
    }
    await load(filters);
    setEditing(null);
    setFormOpen(false);
  }

  async function remove(vehicle: Vehicle) {
    if (!window.confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) return;
    setError("");
    try {
      await deleteVehicle(vehicle.id);
      setVehicles((current) => current.filter((item) => item.id !== vehicle.id));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to delete vehicle");
    }
  }

  async function restock(vehicle: Vehicle, quantity: number) {
    setError("");
    try {
      const updated = await restockVehicle(vehicle.id, quantity);
      setVehicles((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Unable to restock vehicle";
      setError(message);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
      <section className="collection-hero" aria-label="Hegde Motors vehicle collection">
        <img
          className="collection-hero__image"
          src="/images/hero-drive.jpg"
          alt=""
          fetchPriority="high"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div className="collection-hero__shade" />
        <div className="collection-hero__content">
          <p className="eyebrow text-orange-300">HEGDE MOTORS</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
            A better drive
            <br />
            starts right here.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-slate-200 sm:text-base">
            Explore the collection, compare your options, and find a vehicle that feels right for your next chapter.
          </p>
          <a className="hero-link mt-7 inline-flex items-center gap-2" href="#inventory">
            Explore the collection <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="collection-hero__caption" aria-hidden="true">
          A considered collection
        </div>
      </section>

      <section aria-label="Inventory filters" className="mb-7">
        <VehicleSearch onSearch={setFilters} />
      </section>

      {error && <div className="mb-5"><ErrorMessage message={error} /></div>}
      {isAdmin && formOpen && !editing && (
        <div className="mb-6">
          <VehicleForm
            onSubmit={saveVehicle}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </div>
      )}
      {isAdmin && editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-vehicle-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-5 overflow-hidden rounded-xl">
              <img
                className="h-40 w-full object-cover"
                src={vehicleImageForCategory(editing.category)}
                alt={`${editing.category} vehicle reference`}
              />
            </div>
            <h2 id="edit-vehicle-title" className="sr-only">Edit vehicle details</h2>
            <VehicleForm
              key={editing.id}
              initial={editing}
              onSubmit={saveVehicle}
              onCancel={() => setEditing(null)}
            />
          </section>
        </div>
      )}

      <section id="inventory" className="scroll-mt-8">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">FIND YOUR FIT</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">Available vehicles</h2>
            {!loading && (
              <p className="mt-1 text-sm text-slate-500">
                {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"} in this collection
              </p>
            )}
          </div>
          {isAdmin && !editing && (
            <button
              className="button-primary self-start sm:self-auto"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              + Add vehicle
            </button>
          )}
        </div>
        {notice && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">{notice}</p>}
        {loading ? (
        <LoadingState />
      ) : vehicles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-card">
          <p className="text-lg font-bold text-ink">No vehicles match your search</p>
          <p className="mt-2 text-sm text-slate-500">Try another make, model, category, or price range.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="min-w-0">
              <VehicleCard
                vehicle={vehicle}
                {...(!isAdmin ? {
                  onAddToCart: (selected: Vehicle) => addToCart(selected),
                  cartQuantity: cart.lines.find((line) => line.vehicleId === vehicle.id)?.quantity ?? 0,
                } : {})}
              />
              {isAdmin && (
                <div className="mt-3 flex items-center justify-between px-1">
                  <button
                    className="text-xs font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-ink"
                    onClick={() => {
                      setFormOpen(false);
                      setEditing(vehicle);
                    }}
                  >
                    Edit details
                  </button>
                  <div className="flex items-center gap-4">
                    <StockControls vehicle={vehicle} onRestock={restock} />
                    <button
                      className="text-xs font-bold text-rose-700 underline decoration-rose-200 underline-offset-4"
                      onClick={() => void remove(vehicle)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </section>
    </main>
  );
}
