import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import CodeDetailPage from "../pages/CodeDetailPage";
import { renderWithProviders } from "./test-utils";
import type { HttpCodeDetail, User } from "../lib/api";

const mockHttpCodeDetail: HttpCodeDetail = {
  id: 1,
  code: 404,
  description: "Not Found",
  category: "client_error",
  top_haiku: null,
  haikus: [
    {
      id: 1,
      content: "Page not found here\nThe URL you seek is gone\nFour oh four alas",
      author_name: "Ghost Writer",
      vote_count: 8,
      user_id: 1,
    },
  ],
};

const mockHttpCodeDetailWithUnderscore: HttpCodeDetail = {
  id: 2,
  code: 500,
  description: "Internal Server Error",
  category: "server_error",
  top_haiku: null,
  haikus: [],
};

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  username: "testuser",
};

const server = setupServer(
  http.get("http://localhost:3000/api/v1/http_codes/404", () => {
    return HttpResponse.json({ http_code: mockHttpCodeDetail });
  }),
  http.get("http://localhost:3000/api/v1/http_codes/500", () => {
    return HttpResponse.json({ http_code: mockHttpCodeDetailWithUnderscore });
  }),
  // Default: unauthenticated
  http.get("http://localhost:3000/api/v1/users/me", () => {
    return HttpResponse.json({ error: "Authentication required" }, { status: 401 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderCodeDetailPage(path: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/code/:code" element={<CodeDetailPage />} />
    </Routes>,
    { initialEntries: [path] }
  );
}

describe("CodeDetailPage", () => {
  it("renders loading state initially", () => {
    renderCodeDetailPage("/code/404");
    expect(screen.getByText("Loading haikus...")).toBeInTheDocument();
  });

  it("renders code detail after data loads", async () => {
    renderCodeDetailPage("/code/404");

    await waitFor(() => {
      expect(screen.getByText("404")).toBeInTheDocument();
    });

    expect(screen.getByText("Not Found")).toBeInTheDocument();
  });

  it("displays category with underscores replaced by spaces", async () => {
    renderCodeDetailPage("/code/404");

    await waitFor(() => {
      expect(screen.getByText("client error")).toBeInTheDocument();
    });
  });

  it("renders haiku list and form section after data loads", async () => {
    renderCodeDetailPage("/code/404");

    await waitFor(() => {
      const pre = document.querySelector("pre.haiku-content");
      expect(pre?.textContent).toBe(
        "Page not found here\nThe URL you seek is gone\nFour oh four alas"
      );
    });

    // The form section renders with "Submit Your Haiku" heading after auth resolves
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "Submit Your Haiku" })).toBeInTheDocument();
    });
  });

  it("renders form with submit button when authenticated", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      })
    );

    renderCodeDetailPage("/code/404");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submit Haiku" })).toBeInTheDocument();
    });
  });

  it("renders back link to home page", async () => {
    renderCodeDetailPage("/code/404");

    await waitFor(() => {
      expect(screen.getByText("Not Found")).toBeInTheDocument();
    });

    const backLinks = screen.getAllByRole("link", { name: /Back to all codes/ });
    expect(backLinks.length).toBeGreaterThan(0);
    expect(backLinks[0]).toHaveAttribute("href", "/");
  });

  it("renders error state when request fails", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/http_codes/999", () => {
        return HttpResponse.json({ message: "Not found" }, { status: 404 });
      })
    );

    renderCodeDetailPage("/code/999");

    await waitFor(() => {
      expect(screen.getByText("HTTP code not found")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Back to all codes/ })).toBeInTheDocument();
  });

  it("replaces underscore with space in category badge", async () => {
    renderCodeDetailPage("/code/500");

    await waitFor(() => {
      expect(screen.getByText("server error")).toBeInTheDocument();
    });
  });

  it("renders empty haiku list state for code with no haikus", async () => {
    renderCodeDetailPage("/code/500");

    await waitFor(() => {
      expect(
        screen.getByText("No haikus yet. Be the first to write one!")
      ).toBeInTheDocument();
    });
  });

  it("renders without crashing when code param is absent (codeNumber=0, query disabled)", () => {
    // Render CodeDetailPage via a route that does NOT provide a :code param.
    // useParams returns { code: undefined }, so codeNumber = parseInt(undefined || "0") = 0.
    // The query is disabled (!!0 === false), so no loading/error states — just empty layout.
    renderWithProviders(
      <Routes>
        <Route path="/no-code" element={<CodeDetailPage />} />
      </Routes>,
      { initialEntries: ["/no-code"] }
    );

    // isLoading and error are both false; httpCode is undefined; codeNumber is 0 (falsy)
    // so HaikuForm is not rendered. The page renders with the layout header.
    expect(screen.getByRole("heading", { level: 1, name: "HTTP Haiku" })).toBeInTheDocument();
  });
});
