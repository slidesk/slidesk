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
    expect(result).toBe("Hello $unknown$!");
  });

  it("should handle null translations", () => {
    const presentation = "Hello $$greeting$$!";
    const result = translate(presentation, null);
    expect(result).toBe("Hello $greeting$!");
  });

  it("should handle no matches", () => {
    const presentation = "Hello World!";
    const translations = { translations: { greeting: "Bonjour" } };
    const result = translate(presentation, translations);
    expect(result).toBe("Hello World!");
  });
});
