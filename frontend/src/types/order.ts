export interface CartLine {
  vehicleId: number;
  quantity: number;
}

export interface OrderItem {
  id: number;
  vehicleId: number | null;
  make: string;
  model: string;
  category: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  customerId: number;
  status: "pending" | "cancelled";
  createdAt: string;
  items: OrderItem[];
  customer?: { name: string; email: string };
}

export interface DashboardStats {
  customers: number;
  vehicles: number;
  orders: number;
}
