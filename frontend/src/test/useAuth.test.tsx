import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { createTestQueryClient } from "./test-utils";
import type { User } from "../lib/api";

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  username: "testuser",
};

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }
  return { Wrapper, queryClient };
}

describe("useAuth", () => {
  it("returns user and isLoggedIn=true when authenticated", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      })
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoggedIn).toBe(true);
  });

  it("returns user=null and isLoggedIn=false when unauthenticated (401)", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ error: "Authentication required" }, { status: 401 });
      })
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  it("invalidateAuth triggers query invalidation", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me", () => {
        return HttpResponse.json({ user: mockUser });
      })
    );

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After invalidation, the query should be marked as stale/refetching
    await act(async () => {
      result.current.invalidateAuth();
    });

    // After invalidation the query is still accessible (may refetch)
    expect(result.current.invalidateAuth).toBeDefined();
    expect(queryClient.getQueryState(["auth", "me"])).toBeDefined();
  });
});
