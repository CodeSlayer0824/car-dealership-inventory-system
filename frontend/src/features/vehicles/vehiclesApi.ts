import { apiRequest } from "../../lib/apiClient";
import type { Vehicle, VehicleFilters, VehicleInput } from "../../types/vehicle";
import type { DashboardStats, Order } from "../../types/order";

function toQuery(filters: VehicleFilters): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const result = query.toString();
  return result ? `?${result}` : "";
}

export async function listVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
  const result = await apiRequest<{ vehicles: Vehicle[] }>(`/vehicles/search${toQuery(filters)}`);
  return result.vehicles;
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const result = await apiRequest<{ vehicle: Vehicle }>("/vehicles", { method: "POST", body: input });
  return result.vehicle;
}

export async function updateVehicle(id: number, input: Partial<VehicleInput>): Promise<Vehicle> {
  const result = await apiRequest<{ vehicle: Vehicle }>(`/vehicles/${id}`, {
    method: "PUT",
    body: input,
  });
  return result.vehicle;
}

export async function restockVehicle(id: number, quantity: number): Promise<Vehicle> {
  const result = await apiRequest<{ vehicle: Vehicle }>(`/vehicles/${id}/restock`, {
    method: "POST",
    body: { quantity },
  });
  return result.vehicle;
}

export function deleteVehicle(id: number): Promise<void> {
  return apiRequest(`/vehicles/${id}`, { method: "DELETE" });
}

export async function checkoutOrder(
  items: Array<{ vehicleId: number; quantity: number }>,
  idempotencyKey: string,
): Promise<Order> {
  const result = await apiRequest<{ order: Order }>("/orders/checkout", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: { items },
  });
  return result.order;
}

export async function listMyOrders(): Promise<Order[]> {
  const result = await apiRequest<{ orders: Order[] }>("/orders/mine");
  return result.orders;
}

export async function cancelOrder(orderId: number): Promise<Order> {
  const result = await apiRequest<{ order: Order }>(`/orders/${orderId}/cancel`, {
    method: "POST",
  });
  return result.order;
}

export async function loadAdminDashboard(): Promise<DashboardStats> {
  return apiRequest("/admin/dashboard");
}

export async function listAdminOrders(): Promise<Order[]> {
  const result = await apiRequest<{ orders: Order[] }>("/admin/orders");
  return result.orders;
}
