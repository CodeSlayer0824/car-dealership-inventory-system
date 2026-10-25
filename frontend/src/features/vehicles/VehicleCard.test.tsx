import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VehicleCard } from "./VehicleCard";
import type { Vehicle } from "../../types/vehicle";

const vehicle: Vehicle = {
  id: 7,
  make: "Volvo",
  model: "XC60",
  category: "SUV",
  price: 48990,
  quantity: 1,
  createdAt: "",
  updatedAt: "",
};

describe("VehicleCard", () => {
  afterEach(() => cleanup());

  it("disables cart additions when no stock is available", () => {
    render(<VehicleCard vehicle={{ ...vehicle, quantity: 0 }} onAddToCart={vi.fn()} />);
    expect(screen.getByRole("button", { name: /out of stock/i })).toBeDisabled();
  });

  it("adds an available vehicle to the cart", () => {
    const onAddToCart = vi.fn();
    render(<VehicleCard vehicle={vehicle} onAddToCart={onAddToCart} />);
    fireEvent.click(screen.getByRole("button", { name: /add volvo xc60 to cart/i }));
    expect(onAddToCart).toHaveBeenCalledWith(vehicle);
  });

  it("hides shopping actions when rendered for an admin", () => {
    render(<VehicleCard vehicle={vehicle} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
