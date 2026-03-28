import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import { renderWithProviders } from "./test-utils";
import type { User } from "../lib/api";

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  username: "testuser",
  is_admin: false,
};

const server = setupServer(
  http.get("http://localhost:3000/api/v1/users/me", () => {
    return HttpResponse.json({ error: "Authentication required" }, { status: 401 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderLoginPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<div>Home Page</div>} />
    </Routes>,
    { initialEntries: ["/login"] }
  );
}

describe("LoginPage", () => {
  it("renders email and password fields", () => {
    renderLoginPage();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
  });

  it("shows 'Logging in...' while pending", async () => {
    server.use(
      http.post("http://localhost:3000/api/v1/session", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ user: mockUser });
      })
    );

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/Email/), "test@example.com");
    await user.type(screen.getByLabelText(/Password/), "password123");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();
    });
  });

  it("redirects to / on success", async () => {
    server.use(
      http.post("http://localhost:3000/api/v1/session", () => {
        return HttpResponse.json({ user: mockUser });
      })
    );

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/Email/), "test@example.com");
    await user.type(screen.getByLabelText(/Password/), "password123");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });
  });

  it("shows error from response data", async () => {
    server.use(
      http.post("http://localhost:3000/api/v1/session", () => {
        return HttpResponse.json({ error: "Invalid email or password" }, { status: 401 });
      })
    );

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/Email/), "bad@example.com");
    await user.type(screen.getByLabelText(/Password/), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("shows fallback error when no response data", async () => {
    server.use(
      http.post("http://localhost:3000/api/v1/session", () => {
        return HttpResponse.json({ message: "Internal error" }, { status: 500 });
      })
    );

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/Email/), "test@example.com");
    await user.type(screen.getByLabelText(/Password/), "password123");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByText("Login failed. Please try again.")).toBeInTheDocument();
    });
  });

  it("has a link to the signup page", () => {
    renderLoginPage();
    const signupLink = screen.getByRole("link", { name: /Sign up/ });
    expect(signupLink).toHaveAttribute("href", "/signup");
  });
});
