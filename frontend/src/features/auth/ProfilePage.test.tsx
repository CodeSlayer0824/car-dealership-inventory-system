import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthProvider";
import { ProfilePage } from "./ProfilePage";
import { saveSession } from "../../lib/authStorage";
import type { AuthUser } from "../../types/auth";
import * as authApi from "./authApi";

vi.mock("./authApi", () => ({
  getProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  updateName: vi.fn(),
}));

const user: AuthUser = {
  id: 17,
  name: "Original Name",
  email: "customer@example.com",
  role: "customer",
};

describe("customer profile", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    saveSession({ token: "profile-token", user });
    vi.mocked(authApi.getProfile).mockResolvedValue({ user });
    vi.mocked(authApi.updateName).mockResolvedValue({ user: { ...user, name: "Updated Name" } });
  });

  afterEach(() => cleanup());

  it("loads the profile from the API and saves the updated name", async () => {
    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>,
    );

    expect(await screen.findByDisplayValue("Original Name")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Updated Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Your name has been updated");
    expect(authApi.updateName).toHaveBeenCalledWith("Updated Name");
    expect(JSON.parse(localStorage.getItem("dealership.user") ?? "null").name).toBe("Updated Name");
  });
});
