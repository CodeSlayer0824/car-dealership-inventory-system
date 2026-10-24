import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  it("disables purchase when no stock is available", () => {
    render(<VehicleCard vehicle={{ ...vehicle, quantity: 0 }} onPurchase={vi.fn()} />);
    expect(screen.getByRole("button", { name: /out of stock/i })).toBeDisabled();
  });

  it("requests a purchase for an available vehicle", () => {
    const onPurchase = vi.fn();
    render(<VehicleCard vehicle={vehicle} onPurchase={onPurchase} />);
    fireEvent.click(screen.getByRole("button", { name: /purchase/i }));
    expect(onPurchase).toHaveBeenCalledWith(vehicle);
  });
});
