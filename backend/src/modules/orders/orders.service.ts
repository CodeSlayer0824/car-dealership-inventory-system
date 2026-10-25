import { createHash } from "node:crypto";
import { OrdersRepository, type CheckoutItem } from "./orders.repository.js";

export class OrdersService {
  constructor(private readonly repository: OrdersRepository) {}

  checkout(customerId: number, idempotencyKey: string, items: CheckoutItem[]) {
    const canonicalItems = [...items].sort((first, second) => first.vehicleId - second.vehicleId);
    const requestHash = createHash("sha256").update(JSON.stringify(canonicalItems)).digest("hex");
    return this.repository.checkout(customerId, idempotencyKey, requestHash, canonicalItems);
  }

  customerOrders(customerId: number) {
    return this.repository.listForCustomer(customerId);
  }

  adminOrders() {
    return this.repository.listAll();
  }

  cancel(orderId: number, customerId: number) {
    return this.repository.cancel(orderId, customerId);
  }

  dashboard() {
    return this.repository.dashboard();
  }
}
