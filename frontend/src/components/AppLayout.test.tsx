import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { AuthProvider } from "../features/auth/AuthProvider";
import { CartProvider } from "../features/cart/CartProvider";

describe("application layout", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("shows Hegde Motors branding and the site footer", () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/inventory"]}>
          <CartProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/inventory" element={<main>Inventory</main>} />
              </Route>
            </Routes>
          </CartProvider>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByRole("link", { name: "H Hegde Motors" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent("Hegde Motors. All rights reserved.");
  });
});
