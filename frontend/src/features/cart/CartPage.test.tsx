import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import { CartProvider } from "./CartProvider";
import { CartPage } from "./CartPage";
import { saveSession } from "../../lib/authStorage";
import type { AuthUser } from "../../types/auth";
import type { Vehicle } from "../../types/vehicle";
import * as vehiclesApi from "../vehicles/vehiclesApi";

vi.mock("../vehicles/vehiclesApi", () => ({
  checkoutOrder: vi.fn(),
  listVehicles: vi.fn(),
}));

const customer: AuthUser = {
  id: 14,
  name: "Customer",
  email: "customer@example.com",
  role: "customer",
};

const vehicle: Vehicle = {
  id: 22,
  make: "Honda",
  model: "Civic",
  category: "Sedan",
  price: 15999.99,
  quantity: 2,
  createdAt: "",
  updatedAt: "",
};

function renderCart(quantity = 1) {
  saveSession({ token: "customer-token", user: customer });
  localStorage.setItem(`dealership.cart.${customer.id}`, JSON.stringify([{ vehicleId: vehicle.id, quantity }]));
  localStorage.setItem(`dealership.checkout.${customer.id}`, "stable-checkout-key-001");
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );
}

describe("customer cart and checkout", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(vehiclesApi.listVehicles).mockResolvedValue([vehicle]);
  });

  afterEach(() => cleanup());

  it("limits cart quantity to live stock and supports removing a cart item", async () => {
    renderCart();
    expect(await screen.findByText("Honda")).toBeInTheDocument();
    expect(screen.getAllByText("$15,999.99")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /increase civic quantity/i }));
    const card = screen.getByRole("article");
    expect(within(card).getByLabelText("Quantity")).toHaveTextContent("2");
    expect(screen.getByRole("button", { name: /increase civic quantity/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /confirm order/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(await screen.findByText("Your cart is empty")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(`dealership.cart.${customer.id}`) ?? "null")).toEqual([]);
  });

  it("clears the cart only after checkout succeeds", async () => {
    vi.mocked(vehiclesApi.checkoutOrder).mockResolvedValue({
      id: 81,
      customerId: customer.id,
      status: "pending",
      createdAt: "2026-10-25 10:00:00",
      items: [],
    });
    renderCart();
    fireEvent.click(await screen.findByRole("button", { name: /confirm order/i }));
    expect(await screen.findByRole("status")).toHaveTextContent("Order #81 is confirmed");
    expect(JSON.parse(localStorage.getItem(`dealership.cart.${customer.id}`) ?? "null")).toEqual([]);
    expect(vehiclesApi.checkoutOrder).toHaveBeenCalledWith(
      [{ vehicleId: vehicle.id, quantity: 1 }],
      "stable-checkout-key-001",
    );
  });

  it("preserves the cart and retry key when the backend rejects checkout", async () => {
    vi.mocked(vehiclesApi.checkoutOrder).mockRejectedValue(new Error("Not enough stock"));
    renderCart();
    fireEvent.click(await screen.findByRole("button", { name: /confirm order/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Not enough stock");
    expect(JSON.parse(localStorage.getItem(`dealership.cart.${customer.id}`) ?? "null")).toEqual([
      { vehicleId: vehicle.id, quantity: 1 },
    ]);
    expect(localStorage.getItem(`dealership.checkout.${customer.id}`)).toBe("stable-checkout-key-001");
  });
});
