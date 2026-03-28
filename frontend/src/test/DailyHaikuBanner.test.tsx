import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DailyHaikuBanner from "../components/DailyHaikuBanner";
import { renderWithProviders } from "./test-utils";
import type { DailyHaiku } from "../lib/api";

const mockDailyHaiku: DailyHaiku = {
  id: 7,
  content: "Page not found here\nSearching through empty folders\nSilence greets your call",
  author_name: "Code Poet",
  vote_count: 42,
  user_id: 1,
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

  it("copy button writes correct URL to clipboard and shows Copied! feedback", async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    renderWithProviders(<DailyHaikuBanner haiku={mockDailyHaiku} />);

    const copyBtn = screen.getByRole("button", { name: /Copy link/i });
    await user.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledWith(
      `${window.location.origin}/code/404`
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Copied!/i })).toBeInTheDocument();
    });
    writeTextSpy.mockRestore();
  });

  it("Copied! label resets to Copy link after 2 seconds", async () => {
    vi.useFakeTimers();
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    renderWithProviders(<DailyHaikuBanner haiku={mockDailyHaiku} />);

    fireEvent.click(screen.getByRole("button", { name: /Copy link/i }));
    expect(screen.getByRole("button", { name: /Copied!/i })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: /Copy link/i })).toBeInTheDocument();

    writeTextSpy.mockRestore();
    vi.useRealTimers();
  });
});

afterEach(() => {
  vi.useRealTimers();
});
