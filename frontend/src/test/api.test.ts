import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { httpCodesApi, haikusApi } from "../lib/api";
import type { HttpCode, HttpCodeDetail, Haiku } from "../lib/api";

const mockHaiku: Haiku = {
  id: 1,
  content: "Not found at all\nThe page you seek has vanished\nFour oh four you get",
  author_name: "Test Author",
  vote_count: 5,
  created_at: "2026-03-24T00:00:00Z",
};

const mockHttpCode: HttpCode = {
  id: 1,
  code: 404,
  description: "Not Found",
  category: "client_error",
  top_haiku: mockHaiku,
};

const mockHttpCodeDetail: HttpCodeDetail = {
  ...mockHttpCode,
  haikus: [mockHaiku],
};

const server = setupServer(
  http.get("http://localhost:3000/api/v1/http_codes", () => {
    return HttpResponse.json({ http_codes: [mockHttpCode] });
  }),
  http.get("http://localhost:3000/api/v1/http_codes/404", () => {
    return HttpResponse.json({ http_code: mockHttpCodeDetail });
  }),
  http.post("http://localhost:3000/api/v1/haikus", () => {
    return HttpResponse.json({ haiku: mockHaiku }, { status: 201 });
  }),
  http.post("http://localhost:3000/api/v1/haikus/1/vote", () => {
    return HttpResponse.json({ haiku: { ...mockHaiku, vote_count: 6 } });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("httpCodesApi", () => {
  describe("getAll", () => {
    it("returns list of http codes", async () => {
      const result = await httpCodesApi.getAll();
      expect(result).toEqual([mockHttpCode]);
    });
  });

  describe("getByCode", () => {
    it("returns http code detail", async () => {
      const result = await httpCodesApi.getByCode(404);
      expect(result).toEqual(mockHttpCodeDetail);
    });
  });
});

describe("haikusApi", () => {
  describe("create", () => {
    it("creates a haiku and returns it", async () => {
      const result = await haikusApi.create({
        http_code: 404,
        content: "Line one\nLine two\nLine three",
        author_name: "Test Author",
      });
      expect(result).toEqual(mockHaiku);
    });
  });

  describe("vote", () => {
    it("votes on a haiku and returns updated haiku", async () => {
      const result = await haikusApi.vote(1);
      expect(result.vote_count).toBe(6);
    });
  });
});
