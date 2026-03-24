import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import HaikuForm from "../components/HaikuForm";
import { renderWithProviders } from "./test-utils";
import type { Haiku } from "../lib/api";

const mockHaiku: Haiku = {
  id: 99,
  content: "Line one\nLine two\nLine three",
  author_name: "TestUser",
  vote_count: 0,
};

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("HaikuForm", () => {
  it("renders form with content textarea and author name input", () => {
    renderWithProviders(<HaikuForm httpCode={404} />);
    expect(screen.getByLabelText(/Haiku/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Haiku" })).toBeInTheDocument();
  });

  it("shows validation error when content has fewer than 3 non-blank lines", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    await user.type(screen.getByLabelText(/Haiku/), "Only one line");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    expect(screen.getByText("Haiku must have exactly 3 lines")).toBeInTheDocument();
  });

  it("shows validation error when content has more than 3 non-blank lines", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    const textarea = screen.getByLabelText(/Haiku/);
    await user.type(textarea, "Line one{Enter}Line two{Enter}Line three{Enter}Line four");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    expect(screen.getByText("Haiku must have exactly 3 lines")).toBeInTheDocument();
  });

  it("blank lines are ignored in line count", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    const textarea = screen.getByLabelText(/Haiku/);
    // Two non-blank lines with a blank line between — should still fail (only 2 lines)
    await user.type(textarea, "Line one{Enter}{Enter}Line two");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    expect(screen.getByText("Haiku must have exactly 3 lines")).toBeInTheDocument();
  });

  it("clears form and error after successful submission", async () => {
    server.use(
      http.post("http://localhost:3000/api/v1/haikus", () => {
        return HttpResponse.json({ haiku: mockHaiku }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    const textarea = screen.getByLabelText(/Haiku/);
    const authorInput = screen.getByLabelText(/Your Name/);

    await user.type(textarea, "Line one{Enter}Line two{Enter}Line three");
    await user.type(authorInput, "TestUser");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    await waitFor(() => {
      expect(textarea).toHaveValue("");
      expect(authorInput).toHaveValue("");
    });
  });

  it("shows button text 'Submitting...' while pending", async () => {
    // Use a handler that never resolves during the test to catch the pending state
    server.use(
      http.post("http://localhost:3000/api/v1/haikus", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({ haiku: mockHaiku }, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

    const textarea = screen.getByLabelText(/Haiku/);
    await user.type(textarea, "Line one{Enter}Line two{Enter}Line three");
    await user.click(screen.getByRole("button", { name: "Submit Haiku" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submitting..." })).toBeDisabled();
    });
  });

  it("shows joined error messages from axios errors array", async () => {
    server.use(
      http.post("http://localhost:3000/api/v1/haikus", () => {
        return HttpResponse.json(
          { errors: ["Content is too short", "Author name is invalid"] },
          { status: 422 }
        );
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

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
      http.post("http://localhost:3000/api/v1/haikus", () => {
        return HttpResponse.json({ message: "Internal error" }, { status: 500 });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

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
    const user = userEvent.setup();
    renderWithProviders(<HaikuForm httpCode={404} />);

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
