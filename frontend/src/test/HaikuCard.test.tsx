import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import HaikuCard from "../components/HaikuCard";
import { renderWithProviders } from "./test-utils";
import type { Haiku } from "../lib/api";

const mockHaiku: Haiku = {
  id: 42,
  content: "Autumn leaves fall down\nServer returns an error\nFive hundred haiku",
  author_name: "Poet",
  vote_count: 3,
};

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("HaikuCard", () => {
  it("renders haiku content, author, and vote count", () => {
    renderWithProviders(<HaikuCard haiku={mockHaiku} />);
    // <pre> preserves newlines; match via textContent
    const pre = document.querySelector("pre.haiku-content");
    expect(pre?.textContent).toBe(mockHaiku.content);
    expect(screen.getByText(/Poet/)).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveTextContent("3");
  });

  it("vote button is enabled by default", () => {
    renderWithProviders(<HaikuCard haiku={mockHaiku} />);
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("disables button and sets voted state after successful vote", async () => {
    server.use(
      http.post("http://localhost:3000/api/v1/haikus/42/vote", () => {
        return HttpResponse.json({ haiku: { ...mockHaiku, vote_count: 4 } });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<HaikuCard haiku={mockHaiku} />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeDisabled();
    });
    expect(screen.getByRole("button")).toHaveClass("voted");
  });

  it("shows alert with API error message on axios error with response data", async () => {
    server.use(
      http.post("http://localhost:3000/api/v1/haikus/42/vote", () => {
        return HttpResponse.json(
          { error: "You have already voted" },
          { status: 422 }
        );
      })
    );

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<HaikuCard haiku={mockHaiku} />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("You have already voted");
    });

    alertSpy.mockRestore();
  });

  it("shows fallback alert message on non-axios error", async () => {
    server.use(
      http.post("http://localhost:3000/api/v1/haikus/42/vote", () => {
        return HttpResponse.json({ something: "else" }, { status: 500 });
      })
    );

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<HaikuCard haiku={mockHaiku} />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed to vote. Please try again.");
    });

    alertSpy.mockRestore();
  });
});
