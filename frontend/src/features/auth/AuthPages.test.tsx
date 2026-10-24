import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import * as authApi from "./authApi";

vi.mock("./authApi", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

const user = { id: 4, name: "Sam Driver", email: "sam@example.com", role: "customer" as const };

function renderAuthPage(page: "login" | "register") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[`/${page}`]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/inventory" element={<p>Inventory dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("authentication pages", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("signs in, stores the session, and navigates to inventory", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: "signed-token", user });
    renderAuthPage("login");
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Inventory dashboard")).toBeInTheDocument();
    expect(localStorage.getItem("dealership.token")).toBe("signed-token");
  });

  it("shows login API errors without losing the form", async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error("Invalid email or password"));
    renderAuthPage("login");
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("registers as a customer through the public registration flow", async () => {
    vi.mocked(authApi.register).mockResolvedValue({ token: "new-token", user });
    renderAuthPage("register");
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: user.name } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(authApi.register).toHaveBeenCalledWith(user.name, user.email, "password123"));
    expect(await screen.findByText("Inventory dashboard")).toBeInTheDocument();
  });
});
