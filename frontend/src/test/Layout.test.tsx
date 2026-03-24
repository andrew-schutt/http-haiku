import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Layout from "../components/Layout";

describe("Layout", () => {
  it("renders the header with title and tagline", () => {
    render(<Layout>content</Layout>);
    expect(screen.getByRole("heading", { level: 1, name: "HTTP Haiku" })).toBeInTheDocument();
    expect(screen.getByText("Poetry for every status code")).toBeInTheDocument();
  });

  it("renders children inside main container", () => {
    render(<Layout><span data-testid="child">hello</span></Layout>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders footer with copyright text", () => {
    render(<Layout>content</Layout>);
    expect(screen.getByText(/2026 HTTP Haiku/)).toBeInTheDocument();
  });
});
