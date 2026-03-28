import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { Routes, Route } from "react-router-dom";
import AdminPage from "../pages/AdminPage";
import { renderWithProviders } from "./test-utils";
import type { User } from "../lib/api";

const mockAdminUser: User = {
  id: 1,
  email: "admin@example.com",
  username: "admin",
  is_admin: true,
};

const mockNonAdminUser: User = {
  id: 2,
  email: "user@example.com",
  username: "user",
  is_admin: false,
};

const mockHaikus = [
  {
    id: 1,
    content: "line one\nline two\nline three",
    author_name: "poet",
    vote_count: 5,
    created_at: "2026-01-01T00:00:00.000Z",
    http_code: { code: 404, description: "Not Found" },
    user: { id: 2, username: "poet" },
  },
];

const mockUsers = [
  { id: 1, email: "admin@example.com", username: "admin", is_admin: true, created_at: "2026-01-01T00:00:00.000Z" },
  { id: 2, email: "user@example.com", username: "user", is_admin: false, created_at: "2026-01-01T00:00:00.000Z" },
];

const server = setupServer(
  http.get("http://localhost:3000/api/v1/users/me", () => {
    return HttpResponse.json({ error: "Authentication required" }, { status: 401 });
  }),
  http.get("http://localhost:3000/api/v1/admin/haikus", () => {
    return HttpResponse.json({ haikus: mockHaikus });
  }),
  http.get("http://localhost:3000/api/v1/admin/users", () => {
    return HttpResponse.json({ users: mockUsers });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderAdminPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>,
    { initialEntries: ["/admin"] }
  );
}

describe("AdminPage", () => {
  it("redirects to home when not logged in", async () => {
    renderAdminPage();
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });

  it("redirects to home when logged in but not admin", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockNonAdminUser });
      })
    );
    renderAdminPage();
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });

  it("renders admin dashboard heading when admin", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      })
    );
    renderAdminPage();
    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });
  });

  it("renders haiku table with haiku data when admin", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      })
    );
    renderAdminPage();
    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("poet")).toBeInTheDocument();
    });
    expect(screen.getByText("404 Not Found")).toBeInTheDocument();
  });

  it("deletes haiku when delete button clicked and confirmed", async () => {
    let deleteCalled = false;
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      }),
      http.delete("http://localhost:3000/api/v1/admin/haikus/1", () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    // Confirm dialog always returns true
    const originalConfirm = window.confirm;
    window.confirm = () => true;

    renderAdminPage();

    const deleteBtn = await screen.findByRole("button", { name: "Delete" });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });

    window.confirm = originalConfirm;
  });

  it("does not delete haiku when delete cancelled", async () => {
    let deleteCalled = false;
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      }),
      http.delete("http://localhost:3000/api/v1/admin/haikus/1", () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const originalConfirm = window.confirm;
    window.confirm = () => false;

    renderAdminPage();

    const deleteBtn = await screen.findByRole("button", { name: "Delete" });
    fireEvent.click(deleteBtn);

    // Give time for any async operations
    await waitFor(() => {
      expect(screen.getByText("poet")).toBeInTheDocument();
    });
    expect(deleteCalled).toBe(false);

    window.confirm = originalConfirm;
  });

  it("renders user table when clicking Users tab", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      })
    );
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
  });

  it("disables delete button for current user in user table", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      })
    );
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    const deleteButtons = await screen.findAllByRole("button", { name: "Delete" });
    // First button is for admin (id=1, same as current user id=1) — must be disabled
    expect(deleteButtons[0]).toBeDisabled();
    // Second button is for the other user — must be enabled
    expect(deleteButtons[1]).not.toBeDisabled();
  });

  it("deletes user when delete button clicked and confirmed", async () => {
    let deletedUserId: string | null = null;
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      }),
      http.delete("http://localhost:3000/api/v1/admin/users/:id", ({ params }) => {
        deletedUserId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const originalConfirm = window.confirm;
    window.confirm = () => true;

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    const deleteButtons = await screen.findAllByRole("button", { name: "Delete" });
    // Click the second (non-self) delete button
    fireEvent.click(deleteButtons[1]);

    await waitFor(() => {
      expect(deletedUserId).toBe("2");
    });

    window.confirm = originalConfirm;
  });

  it("shows Haikus and Users tab buttons", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      })
    );
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Haikus" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Users" })).toBeInTheDocument();
  });

  it("shows admin badge for admin users in user table", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      })
    );
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    await waitFor(() => {
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });
  });

  it("switches back to haiku tab after viewing users tab", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      })
    );
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    // Switch to Users tab
    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    // Switch back to Haikus tab
    fireEvent.click(screen.getByRole("button", { name: "Haikus" }));

    await waitFor(() => {
      expect(screen.getByText("poet")).toBeInTheDocument();
    });
  });

  it("does not delete user when delete cancelled", async () => {
    let deleteCalled = false;
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      }),
      http.delete("http://localhost:3000/api/v1/admin/users/:id", () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const originalConfirm = window.confirm;
    window.confirm = () => false;

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    const deleteButtons = await screen.findAllByRole("button", { name: "Delete" });
    // Click the second (non-self) delete button
    fireEvent.click(deleteButtons[1]);

    // Give time for any async operations
    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });
    expect(deleteCalled).toBe(false);

    window.confirm = originalConfirm;
  });

  it("shows loading state while haiku data is loading", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      }),
      http.get("http://localhost:3000/api/v1/admin/haikus", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ haikus: [] });
      })
    );

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    expect(screen.getByText("Loading haikus...")).toBeInTheDocument();
  });

  it("shows error state when haiku request fails", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      }),
      http.get("http://localhost:3000/api/v1/admin/haikus", () => {
        return HttpResponse.json({ error: "Forbidden" }, { status: 403 });
      })
    );

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Failed to load haikus.")).toBeInTheDocument();
    });
  });

  it("shows loading state while user data is loading", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      }),
      http.get("http://localhost:3000/api/v1/admin/users", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ users: [] });
      })
    );

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  it("shows error state when user request fails", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockAdminUser });
      }),
      http.get("http://localhost:3000/api/v1/admin/users", () => {
        return HttpResponse.json({ error: "Forbidden" }, { status: 403 });
      })
    );

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to load users.")).toBeInTheDocument();
    });
  });
});
