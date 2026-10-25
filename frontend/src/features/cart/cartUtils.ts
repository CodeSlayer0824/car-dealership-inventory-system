import type { CartLine } from "../../types/order";
import type { Vehicle } from "../../types/vehicle";

export function vehicleImageForCategory(category: string): string {
  const normalized = category.toLowerCase();
  if (normalized.includes("suv") || normalized.includes("crossover")) {
    return "/images/vehicle-suv.jpg";
  }
  if (normalized.includes("coupe") || normalized.includes("sport")) {
    return "/images/vehicle-coupe.jpg";
  }
  return "/images/vehicle-sedan.jpg";
}

export function cartLineTotal(line: CartLine, vehicles: Map<number, Vehicle>): number {
  const vehicle = vehicles.get(line.vehicleId);
  return vehicle ? Math.round(vehicle.price * 100) * line.quantity : 0;
}
