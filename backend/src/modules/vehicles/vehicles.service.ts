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

  getById(id: number) {
    const vehicle = this.repository.findById(id);
    if (!vehicle) throw new AppError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");
    return present(vehicle);
  }

  create(input: { make: string; model: string; category: string; price: number; quantity: number }) {
    try {
      return present(this.repository.create({ ...input, priceCents: toPriceCents(input.price) }));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("A vehicle with this make")) {
        throw new AppError(409, error.message, "DUPLICATE_VEHICLE");
      }
      throw error;
    }
  }

  update(id: number, input: Partial<{ make: string; model: string; category: string; price: number; quantity: number }>) {
    const { price, ...fields } = input;
    let vehicle: VehicleRecord | undefined;
    try {
      vehicle = this.repository.update(id, {
        ...fields,
        ...(price === undefined ? {} : { priceCents: toPriceCents(price) }),
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("A vehicle with this make")) {
        throw new AppError(409, error.message, "DUPLICATE_VEHICLE");
      }
      throw error;
    }
    if (!vehicle) throw new AppError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");
    return present(vehicle);
  }

  delete(id: number): void {
    const result = this.repository.delete(id);
    if (result === "not_found") throw new AppError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");
    if (result === "pending_order") {
      throw new AppError(409, "A vehicle with a pending order cannot be deleted", "VEHICLE_HAS_PENDING_ORDER");
    }
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
