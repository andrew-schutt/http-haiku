import { describe, it, expect } from "vitest";
import HaikuList from "../components/HaikuList";
import { renderWithProviders } from "./test-utils";
import { screen } from "@testing-library/react";
import type { Haiku } from "../lib/api";

const haikus: Haiku[] = [
  {
    id: 1,
    content: "First haiku here\nWith three lines of poetry\nBeautiful indeed",
    author_name: "AuthorOne",
    vote_count: 2,
    user_id: 1,
  },
  {
    id: 2,
    content: "Second haiku now\nAnother three lines for you\nEnjoy the haiku",
    author_name: "AuthorTwo",
    vote_count: 7,
    user_id: 2,
  },
];

describe("HaikuList", () => {
  it("renders empty state when haikus array is empty", () => {
    renderWithProviders(<HaikuList haikus={[]} code={404} />);
    expect(
      screen.getByText("No haikus yet. Be the first to write one!")
    ).toBeInTheDocument();
  });

  it("renders a HaikuCard for each haiku when list is non-empty", () => {
    renderWithProviders(<HaikuList haikus={haikus} code={404} />);
    // <pre> elements preserve newlines; use textContent matching
    const pres = document.querySelectorAll("pre.haiku-content");
    const contents = Array.from(pres).map((el) => el.textContent);
    expect(contents).toContain(haikus[0].content);
    expect(contents).toContain(haikus[1].content);
  });

  it("renders the haiku-list container class when non-empty", () => {
    const { container } = renderWithProviders(<HaikuList haikus={haikus} code={404} />);
    expect(container.querySelector(".haiku-list")).toBeInTheDocument();
  });
});
