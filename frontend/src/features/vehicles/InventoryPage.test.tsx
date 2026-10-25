import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { CartProvider } from "../cart/CartProvider";
import { saveSession } from "../../lib/authStorage";
import type { AuthUser } from "../../types/auth";
import type { Vehicle } from "../../types/vehicle";
import * as vehiclesApi from "./vehiclesApi";
import { InventoryPage } from "./InventoryPage";

vi.mock("./vehiclesApi", () => ({
  createVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
  listVehicles: vi.fn(),
  restockVehicle: vi.fn(),
  updateVehicle: vi.fn(),
}));

const vehicle: Vehicle = {
  id: 12,
  make: "Volvo",
  model: "XC60",
  category: "SUV",
  price: 48990,
  quantity: 2,
  createdAt: "",
  updatedAt: "",
};

function renderInventory(user: AuthUser) {
  saveSession({ token: "test-token", user });
  return render(
    <AuthProvider>
      <CartProvider>
        <InventoryPage />
      </CartProvider>
    </AuthProvider>,
  );
}

describe("InventoryPage role controls", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(vehiclesApi.listVehicles).mockResolvedValue([vehicle]);
  });

  afterEach(() => cleanup());

  it("keeps browsing and cart actions available while hiding management from customers", async () => {
    renderInventory({
      id: 4,
      name: "Sam Driver",
      email: "sam@example.com",
      role: "customer",
    });

    expect(await screen.findByText("Volvo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add volvo xc60 to cart/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /search inventory/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+ add vehicle/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit details/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^restock$/i })).not.toBeInTheDocument();
  });

  it("shows add, edit, delete, and restock controls to administrators", async () => {
    renderInventory({
      id: 5,
      name: "Alex Admin",
      email: "admin@example.com",
      role: "admin",
    });

    expect(await screen.findByText("Volvo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ add vehicle/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit details/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^restock$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add volvo xc60 to cart/i })).not.toBeInTheDocument();
  });

  it("opens the edit form in a dialog with the vehicle's current fields", async () => {
    renderInventory({
      id: 5,
      name: "Alex Admin",
      email: "admin@example.com",
      role: "admin",
    });
    fireEvent.click(await screen.findByRole("button", { name: /edit details/i }));
    const dialog = screen.getByRole("dialog", { name: "Edit vehicle details" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("Volvo")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("XC60")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("SUV")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("48990")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("2")).toBeInTheDocument();
    expect(within(dialog).getByRole("img", { name: /suv vehicle reference/i })).toBeInTheDocument();
  });
});
