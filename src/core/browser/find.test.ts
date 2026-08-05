import { afterEach, describe, expect, it } from "bun:test";
import findBrowser from "./find";

const reset = () => {
  Bun.env.SLIDESK_CHROME = undefined;
  Bun.env.CHROME_PATH = undefined;
};

describe("findBrowser function", () => {
  afterEach(reset);

  it("should use SLIDESK_CHROME when it exists", () => {
    Bun.env.SLIDESK_CHROME = import.meta.path;
    expect(findBrowser()).toBe(import.meta.path);
  });

  it("should fall back to CHROME_PATH", () => {
    Bun.env.CHROME_PATH = import.meta.path;
    expect(findBrowser()).toBe(import.meta.path);
  });

  it("should return null when the given path does not exist", () => {
    Bun.env.SLIDESK_CHROME = "/nope/not/a/browser";
    expect(findBrowser()).toBeNull();
  });

  it("should return a path or null when auto-detecting", () => {
    const found = findBrowser();
    expect(found === null || typeof found === "string").toBe(true);
  });
});
