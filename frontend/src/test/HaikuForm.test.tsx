import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import HaikuForm from "../components/HaikuForm";
import { renderWithProviders } from "./test-utils";
import type { Haiku, User } from "../lib/api";

const mockHaiku: Haiku = {
  id: 99,
  content: "Line one\nLine two\nLine three",
  author_name: "testuser",
  vote_count: 0,
  user_id: 1,
};

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  username: "testuser",
  is_admin: false,
};

const server = setupServer(
  // Default: unauthenticated
  http.get("http://localhost:3000/api/v1/users/me", () => {
    return HttpResponse.json({ error: "Authentication required" }, { status: 401 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("HaikuForm", () => {
  it("shows login prompt when not authenticated", async () => {
    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Submit Haiku" })).not.toBeInTheDocument();
  });

  it("shows form (without author name field) when authenticated", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      })
    );

    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submit Haiku" })).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/Your Name/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
  });

  it("shows validation error when content has fewer than 3 non-blank lines", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Haiku/), "Only one line");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    expect(screen.getByText("Haiku must have exactly 3 lines")).toBeInTheDocument();
  });

  it("shows validation error when content has more than 3 non-blank lines", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Haiku/);
    await user.type(textarea, "Line one{Enter}Line two{Enter}Line three{Enter}Line four");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    expect(screen.getByText("Haiku must have exactly 3 lines")).toBeInTheDocument();
  });

  it("blank lines are ignored in line count", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Haiku/);
    // Two non-blank lines with a blank line between — should still fail (only 2 lines)
    await user.type(textarea, "Line one{Enter}{Enter}Line two");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    expect(screen.getByText("Haiku must have exactly 3 lines")).toBeInTheDocument();
  });

  it("clears form and error after successful submission", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      }),
      http.post("http://localhost:3000/api/v1/haikus", () => {
        return HttpResponse.json({ haiku: mockHaiku }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Haiku/);
    await user.type(textarea, "Line one{Enter}Line two{Enter}Line three");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("does not include author_name in the submission request body", async () => {
    let capturedBody: unknown = null;

    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      }),
      http.post("http://localhost:3000/api/v1/haikus", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ haiku: mockHaiku }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Haiku/), "Line one{Enter}Line two{Enter}Line three");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });

    expect((capturedBody as { haiku: Record<string, unknown> }).haiku).not.toHaveProperty("author_name");
  });

  it("shows button text 'Submitting...' while pending", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      }),
      http.post("http://localhost:3000/api/v1/haikus", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ haiku: mockHaiku }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Haiku/);
    await user.type(textarea, "Line one{Enter}Line two{Enter}Line three");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submitting..." })).toBeDisabled();
    });
  });

  it("shows joined error messages from axios errors array", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      }),
      http.post("http://localhost:3000/api/v1/haikus", () => {
        return HttpResponse.json(
          { errors: ["Content is too short", "Author name is invalid"] },
          { status: 422 }
        );
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Haiku/);
    await user.type(textarea, "Line one{Enter}Line two{Enter}Line three");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    await waitFor(() => {
      expect(
        screen.getByText("Content is too short, Author name is invalid")
      ).toBeInTheDocument();
    });
  });

  it("shows fallback error message when axios error has no errors array", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      }),
      http.post("http://localhost:3000/api/v1/haikus", () => {
        return HttpResponse.json({ message: "Internal error" }, { status: 500 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Haiku/);
    await user.type(textarea, "Line one{Enter}Line two{Enter}Line three");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to submit haiku. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("clears previous error on new submit attempt", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
    });

    // First submit with invalid input — triggers error
    await user.type(screen.getByLabelText(/Haiku/), "Only one line");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));
    expect(screen.getByText("Haiku must have exactly 3 lines")).toBeInTheDocument();

    // Clear the textarea and type another invalid input — error resets then reappears
    const textarea = screen.getByLabelText(/Haiku/);
    await user.clear(textarea);
    await user.type(textarea, "Still one line");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));
    expect(screen.getByText("Haiku must have exactly 3 lines")).toBeInTheDocument();
  });
});
