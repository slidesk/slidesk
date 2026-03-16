import { describe, expect, it } from "bun:test";
import replaceAsync from "./replaceAsync";

describe("replaceAsync function", () => {
  it("should replace matched patterns with async function results", async () => {
    const result = await replaceAsync("hello world", /(\w+)/g, async (match) =>
      match.toUpperCase(),
    );
    expect(result).toBe("HELLO WORLD");
  });

  it("should handle async function that returns different content", async () => {
    const result = await replaceAsync(
      "a b c",
      /(\w)/g,
      async (match) => `-${match}-`,
    );
    expect(result).toBe("-a- -b- -c-");
  });

  it("should handle no matches", async () => {
    const result = await replaceAsync("hello", /xyz/g, async (match) =>
      match.toUpperCase(),
    );
    expect(result).toBe("hello");
  });

  it("should handle empty string", async () => {
    const result = await replaceAsync("", /(\w)/g, async (match) =>
      match.toUpperCase(),
    );
    expect(result).toBe("");
  });

  it("should pass capture groups to async function", async () => {
    const result = await replaceAsync(
      "ab cd",
      /(\w)(\w)/g,
      async (match, g1, g2) => `${g1}-${g2}`,
    );
    expect(result).toBe("a-b c-d");
  });
});
