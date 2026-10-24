import { describe, expect, it } from "vitest";
import { createVehicleSchema } from "../../src/modules/vehicles/vehicles.schemas.js";

describe("vehicle price validation", () => {
  const vehicle = {
    make: "Test",
    model: "Car",
    category: "Sedan",
    price: 0.29,
    quantity: 1,
  };

  it("accepts valid two-decimal prices despite binary floating-point representation", () => {
    expect(createVehicleSchema.safeParse(vehicle).success).toBe(true);
  });

  it("rejects prices with more than two decimal places", () => {
    expect(createVehicleSchema.safeParse({ ...vehicle, price: 0.291 }).success).toBe(false);
  });
});
