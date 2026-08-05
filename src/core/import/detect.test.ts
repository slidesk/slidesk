import { describe, expect, it } from "bun:test";
import detect, { isURL } from "./detect";
import { presentationId } from "./gslides";

const bytes = (value: string) => new TextEncoder().encode(value);

describe("isURL function", () => {
  it("should recognise http and https", () => {
    expect(isURL("https://example.com/a")).toBe(true);
    expect(isURL("./deck.pptx")).toBe(false);
  });
});

describe("detect function", () => {
  it("should detect a Google Slides url", () => {
    expect(
      detect("https://docs.google.com/presentation/d/ABC/edit", null),
    ).toBe("gslides");
  });

  it("should treat any other url as reveal.js", () => {
    expect(detect("https://example.com/talk/", null)).toBe("revealjs");
  });

  it("should detect by extension", () => {
    expect(detect("a/deck.PPTX", null)).toBe("pptx");
    expect(detect("a/index.html", null)).toBe("revealjs");
    expect(detect("a/slides.md", null)).toBe("slidev");
  });

  it("should sniff a zip as pptx", () => {
    expect(detect("deck", new Uint8Array([0x50, 0x4b, 3, 4]))).toBe("pptx");
  });

  it("should sniff reveal markup", () => {
    expect(detect("deck", bytes(`<div class="slides"><section>`))).toBe(
      "revealjs",
    );
  });

  it("should fall back to slidev for plain text", () => {
    expect(detect("deck", bytes("# hello\n\ncontent"))).toBe("slidev");
  });
});

describe("presentationId function", () => {
  it("should read the id from an edit url", () => {
    expect(
      presentationId(
        "https://docs.google.com/presentation/d/1a-B_c2/edit#slide=id.p",
      ),
    ).toBe("1a-B_c2");
  });

  it("should read the id from a published url", () => {
    expect(
      presentationId("https://docs.google.com/presentation/d/e/2PACX-1v/pub"),
    ).toBe("2PACX-1v");
  });

  it("should return null when there is no id", () => {
    expect(presentationId("https://docs.google.com/presentation/")).toBeNull();
  });
});
