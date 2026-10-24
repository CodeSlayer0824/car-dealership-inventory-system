import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VehicleSearch } from "./VehicleSearch";

describe("VehicleSearch", () => {
  it("submits text and price filters", () => {
    const onSearch = vi.fn();
    render(<VehicleSearch onSearch={onSearch} />);
    fireEvent.change(screen.getByLabelText(/make/i), { target: { value: "Toyota" } });
    fireEvent.change(screen.getByLabelText(/minimum price/i), { target: { value: "10000" } });
    fireEvent.click(screen.getByRole("button", { name: /search inventory/i }));
    expect(onSearch).toHaveBeenCalledWith({ make: "Toyota", minPrice: 10000 });
  });
});
