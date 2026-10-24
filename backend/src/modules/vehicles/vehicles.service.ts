import { AppError } from "../../errors/AppError.js";
import { toPriceCents } from "./vehicles.schemas.js";
import { VehiclesRepository, type VehicleFilters, type VehicleRecord } from "./vehicles.repository.js";

function present(vehicle: VehicleRecord) {
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    category: vehicle.category,
    price: vehicle.price_cents / 100,
    quantity: vehicle.quantity,
    createdAt: vehicle.created_at,
    updatedAt: vehicle.updated_at,
  };
}

export class VehiclesService {
  constructor(private readonly repository: VehiclesRepository) {}

  list(filters: VehicleFilters = {}) {
    return this.repository.findAll({
      ...filters,
      minPrice: filters.minPrice === undefined ? undefined : toPriceCents(filters.minPrice),
      maxPrice: filters.maxPrice === undefined ? undefined : toPriceCents(filters.maxPrice),
    }).map(present);
  }

  create(input: { make: string; model: string; category: string; price: number; quantity: number }) {
    return present(this.repository.create({ ...input, priceCents: toPriceCents(input.price) }));
  }

  update(id: number, input: Partial<{ make: string; model: string; category: string; price: number; quantity: number }>) {
    const { price, ...fields } = input;
    const vehicle = this.repository.update(id, {
      ...fields,
      ...(price === undefined ? {} : { priceCents: toPriceCents(price) }),
    });
    if (!vehicle) throw new AppError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");
    return present(vehicle);
  }

  delete(id: number): void {
    if (!this.repository.delete(id)) throw new AppError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");
  }

  purchase(id: number) {
    const changes = this.repository.purchaseOne(id);
    if (!changes) {
      if (!this.repository.findById(id)) {
        throw new AppError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");
      }
      throw new AppError(409, "Vehicle is out of stock", "OUT_OF_STOCK");
    }
    return present(this.repository.findById(id)!);
  }

  restock(id: number, quantity: number) {
    const changes = this.repository.restock(id, quantity);
    if (!changes) {
      if (!this.repository.findById(id)) {
        throw new AppError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");
      }
      throw new AppError(400, "Restock would exceed the supported stock limit", "STOCK_LIMIT_EXCEEDED");
    }
    return present(this.repository.findById(id)!);
  }
}
