import type { Vehicle } from "../../types/vehicle";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function VehicleCard({
  vehicle,
  onPurchase,
  busy = false,
}: {
  vehicle: Vehicle;
  onPurchase: (vehicle: Vehicle) => void;
  busy?: boolean;
}) {
  const initials = vehicle.make.slice(0, 1).toUpperCase();
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex h-40 items-end justify-between overflow-hidden bg-gradient-to-br from-ink via-slate-700 to-slate-500 p-5 text-white">
        <div className="absolute -right-5 -top-12 h-44 w-44 rounded-full border-[24px] border-white/10" />
        <div className="relative">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
            {vehicle.category}
          </span>
          <div className="mt-4 text-5xl font-black tracking-tight text-white/20">{initials}</div>
        </div>
        <span className="relative rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
          {vehicle.quantity > 0 ? `${vehicle.quantity} in stock` : "Sold out"}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{vehicle.make}</p>
        <h2 className="mt-1 text-xl font-bold text-ink">{vehicle.model}</h2>
        <div className="mt-5 flex items-end justify-between gap-3">
          <p className="text-2xl font-extrabold tracking-tight text-ink">{currency.format(vehicle.price)}</p>
          <button
            type="button"
            disabled={vehicle.quantity === 0 || busy}
            onClick={() => onPurchase(vehicle)}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {vehicle.quantity === 0 ? "Out of stock" : busy ? "Purchasing..." : "Purchase"}
          </button>
        </div>
      </div>
    </article>
  );
}
