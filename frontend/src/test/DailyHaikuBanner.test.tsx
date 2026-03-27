import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import DailyHaikuBanner from "../components/DailyHaikuBanner";
import { renderWithProviders } from "./test-utils";
import type { DailyHaiku } from "../lib/api";

const mockDailyHaiku: DailyHaiku = {
  id: 7,
  content: "Page not found here\nSearching through empty folders\nSilence greets your call",
  author_name: "Code Poet",
  vote_count: 42,
  http_code: {
    code: 404,
    description: "Not Found",
  },
};

describe("DailyHaikuBanner", () => {
  it("renders the haiku content", () => {
    renderWithProviders(<DailyHaikuBanner haiku={mockDailyHaiku} />);
    const pre = document.querySelector("pre.haiku-content");
    expect(pre?.textContent).toBe(mockDailyHaiku.content);
  });

  it("renders the author name", () => {
    renderWithProviders(<DailyHaikuBanner haiku={mockDailyHaiku} />);
    expect(screen.getByText(/Code Poet/)).toBeInTheDocument();
  });

  it("renders the vote count", () => {
    renderWithProviders(<DailyHaikuBanner haiku={mockDailyHaiku} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it("renders a link to the http code detail page", () => {
    renderWithProviders(<DailyHaikuBanner haiku={mockDailyHaiku} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/code/404");
    expect(link).toHaveTextContent("HTTP 404 — Not Found");
  });

  it("renders the haiku of the day label", () => {
    renderWithProviders(<DailyHaikuBanner haiku={mockDailyHaiku} />);
    expect(screen.getByText(/Haiku of the Day/i)).toBeInTheDocument();
  });
});
