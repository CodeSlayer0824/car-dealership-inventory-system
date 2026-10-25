import { useState } from "react";
import type { Vehicle } from "../../types/vehicle";
import { vehicleImageForCategory } from "../cart/cartUtils";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function VehicleCard({
  vehicle,
  onAddToCart,
  cartQuantity = 0,
}: {
  vehicle: Vehicle;
  onAddToCart?: (vehicle: Vehicle) => void;
  cartQuantity?: number;
}) {
  const [imageAvailable, setImageAvailable] = useState(true);
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-600">
        {imageAvailable && (
          <img
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            src={vehicleImageForCategory(vehicle.category)}
            alt={`${vehicle.category} vehicle reference`}
            loading="lazy"
            decoding="async"
            onError={() => setImageAvailable(false)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/20" />
        <span className="absolute bottom-4 left-4 rounded-full border border-white/25 bg-ink/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
          {vehicle.category}
        </span>
        <span className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur ${vehicle.quantity > 0 ? "bg-white/90 text-ink" : "bg-ink/80 text-white"}`}>
          {vehicle.quantity > 0 ? `${vehicle.quantity} in stock` : "Sold out"}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">{vehicle.make}</p>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-ink">{vehicle.model}</h3>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Price</p>
            <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-ink">{currency.format(vehicle.price)}</p>
          </div>
          {onAddToCart && (
            <button
              type="button"
              disabled={vehicle.quantity === 0 || cartQuantity >= vehicle.quantity}
              onClick={() => onAddToCart(vehicle)}
              aria-label={vehicle.quantity === 0
                ? `${vehicle.make} ${vehicle.model} is out of stock`
                : cartQuantity >= vehicle.quantity
                  ? `${vehicle.make} ${vehicle.model} has reached the available cart quantity`
                  : `Add ${vehicle.make} ${vehicle.model} to cart`}
              className="min-h-11 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600"
            >
              {vehicle.quantity === 0 ? "Out of stock" : cartQuantity >= vehicle.quantity ? "Stock in cart" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
