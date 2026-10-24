import { useCallback, useEffect, useState } from "react";
import { ErrorMessage } from "../../components/ErrorMessage";
import { LoadingState } from "../../components/LoadingState";
import { useAuth } from "../auth/AuthProvider";
import type { Vehicle, VehicleFilters, VehicleInput } from "../../types/vehicle";
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  purchaseVehicle,
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
      className="mt-3 flex items-center gap-2"
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [formOpen, setFormOpen] = useState(false);

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

  async function purchase(vehicle: Vehicle) {
    setBusyId(vehicle.id);
    setError("");
    try {
      const updated = await purchaseVehicle(vehicle.id);
      setVehicles((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to complete purchase");
    } finally {
      setBusyId(null);
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
      <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">THE COLLECTION</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-ink sm:text-5xl">Find your next drive.</h1>
          <p className="mt-3 max-w-xl text-slate-500">Thoughtfully selected vehicles, ready for the road. Browse the current Northstar collection.</p>
        </div>
        <button
          className="button-primary self-start md:self-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Add vehicle
        </button>
      </section>

      <section aria-label="Inventory filters" className="mb-6">
        <VehicleSearch onSearch={setFilters} />
      </section>

      {error && <div className="mb-5"><ErrorMessage message={error} /></div>}
      {formOpen && (
        <div className="mb-6">
          <VehicleForm
            initial={editing ?? undefined}
            onSubmit={saveVehicle}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Available vehicles</h2>
        {!loading && <span className="text-sm text-slate-500">{vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}</span>}
      </div>
      {loading ? (
        <LoadingState />
      ) : vehicles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-lg font-bold text-ink">No vehicles match your search</p>
          <p className="mt-2 text-sm text-slate-500">Try another make, model, category, or price range.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="min-w-0">
              <VehicleCard vehicle={vehicle} onPurchase={purchase} busy={busyId === vehicle.id} />
              <div className="mt-2 flex items-center justify-between px-1">
                <button
                  className="text-xs font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-ink"
                  onClick={() => {
                    setEditing(vehicle);
                    setFormOpen(true);
                  }}
                >
                  Edit details
                </button>
                {user?.role === "admin" && (
                  <button
                    className="text-xs font-bold text-rose-700 underline decoration-rose-200 underline-offset-4"
                    onClick={() => void remove(vehicle)}
                  >
                    Delete
                  </button>
                )}
              </div>
              {user?.role === "admin" && <StockControls vehicle={vehicle} onRestock={restock} />}
            </div>
          ))}
        </div>
      )}
      <footer className="mt-14 border-t border-slate-200 py-5 text-center text-xs text-slate-400">
        Inventory updates are reflected as soon as a purchase or restock is completed.
      </footer>
    </main>
  );
}
