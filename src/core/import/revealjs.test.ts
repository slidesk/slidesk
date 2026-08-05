import { describe, expect, it } from "bun:test";
import revealjs from "./revealjs";

const wrap = (slides: string) =>
  `<html><head><title>Deck</title></head><body><div class="reveal"><div class="slides">${slides}</div></div></body></html>`;

describe("revealjs function", () => {
  it("should read the deck title from the head", () => {
    expect(revealjs(wrap("<section><h1>One</h1></section>")).title).toBe(
      "Deck",
    );
  });

  it("should turn each section into a slide", () => {
    const deck = revealjs(
      wrap("<section><h1>One</h1></section><section><h2>Two</h2></section>"),
    );
    expect(deck.slides.map((s) => s.title)).toEqual(["One", "Two"]);
  });

  it("should flatten vertical stacks", () => {
    const deck = revealjs(
      wrap(
        "<section><section><h2>A</h2></section><section><h2>B</h2></section></section>",
      ),
    );
    expect(deck.slides.map((s) => s.title)).toEqual(["A", "B"]);
  });

  it("should extract aside notes", () => {
    const deck = revealjs(
      wrap(
        "<section><h2>A</h2><p>body</p><aside class='notes'>hi</aside></section>",
      ),
    );
    expect(deck.slides[0].notes).toBe("hi");
    expect(deck.slides[0].content).toBe("body");
  });

  it("should keep section classes but drop reveal state ones", () => {
    const deck = revealjs(
      wrap(`<section class="cover dark present"><h2>A</h2></section>`),
    );
    expect(deck.slides[0].classes).toEqual(["cover", "dark"]);
  });

  it("should read a valueless data-markdown section", () => {
    const deck = revealjs(
      wrap(
        `<section data-markdown><script type="text/template">\n## A\n\n- one\n</script></section>`,
      ),
    );
    expect(deck.slides[0].title).toBe("A");
    expect(deck.slides[0].content).toBe("- one");
  });

  it("should reject markup without a slides container", () => {
    expect(() => revealjs("<html><body><p>nope</p></body></html>")).toThrow(
      "no reveal.js slides container",
    );
  });

  it("should reject an empty slides container", () => {
    expect(() => revealjs(wrap(""))).toThrow("holds no <section>");
  });
});
