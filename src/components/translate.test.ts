import { describe, expect, it } from "bun:test";
import translate from "./translate";

describe("translate function", () => {
  it("should translate simple keys", () => {
    const presentation = "Hello $$greeting$$!";
    const translations = { translations: { greeting: "Bonjour" } };
    const result = translate(presentation, translations);
    expect(result).toBe("Hello Bonjour!");
  });

  it("should handle multiple translations", () => {
    const presentation = "$$greeting$$ $$name$$";
    const translations = { translations: { greeting: "Hello", name: "World" } };
    const result = translate(presentation, translations);
    expect(result).toBe("Hello World");
  });

  it("should keep original text if translation not found", () => {
    const presentation = "Hello $$unknown$$!";
    const translations = { translations: {} };
    const result = translate(presentation, translations);
    expect(result).toBe("Hello $$unknown$$!");
  });

  it("should handle null translations", () => {
    const presentation = "Hello $$greeting$$!";
    const result = translate(presentation, null);
    expect(result).toBe("Hello $$greeting$$!");
  });

  it("should handle no matches", () => {
    const presentation = "Hello World!";
    const translations = { translations: { greeting: "Bonjour" } };
    const result = translate(presentation, translations);
    expect(result).toBe("Hello World!");
  });

  it("inserts a translation containing $ as written", () => {
    expect(
      translate("$$price$$", { translations: { price: "$5, $$key$$ and $&" } }),
    ).toBe("$5, $$key$$ and $&");
  });

  it("translates the speaker notes", () => {
    const notes = (html: string) =>
      `<aside class="sd-notes">${Buffer.from(html).toString("base64")}</aside>`;
    const result = translate(
      `<p>$$title$$</p>${notes("<p>Dites $$hello$$ — $$unknown$$</p>")}`,
      { translations: { title: "Été", hello: "bonjour 😀" } },
    );
    expect(result).toBe(
      `<p>Été</p>${notes("<p>Dites bonjour 😀 — $$unknown$$</p>")}`,
    );
  });
});
