import { afterEach, describe, expect, it } from "bun:test";

// other test files replace this module with a stub for the whole process, so
// the real one is pulled in under a distinct specifier
const { default: launch, NOT_FOUND_MESSAGE } = await import(
  `./index.ts?real=${Date.now()}`
);

const previous = {
  slidesk: Bun.env.SLIDESK_CHROME,
  chrome: Bun.env.CHROME_PATH,
};

afterEach(() => {
  Bun.env.SLIDESK_CHROME = previous.slidesk;
  Bun.env.CHROME_PATH = previous.chrome;
});

describe("NOT_FOUND_MESSAGE", () => {
  it("names the browsers an export can use and how to point at one", () => {
    expect(NOT_FOUND_MESSAGE).toContain("Chrome");
    expect(NOT_FOUND_MESSAGE).toContain("Chromium");
    expect(NOT_FOUND_MESSAGE).toContain("Vivaldi");
    expect(NOT_FOUND_MESSAGE).toContain("SLIDESK_CHROME");
  });
});

describe("launch", () => {
  // the success path starts a real browser, so only the configuration errors
  // are exercised here
  it("rejects a SLIDESK_CHROME path that does not exist", () => {
    Bun.env.SLIDESK_CHROME = "/nowhere/chrome";
    expect(launch(800, 600)).rejects.toThrow(NOT_FOUND_MESSAGE);
  });

  it("rejects a CHROME_PATH that does not exist", () => {
    Bun.env.SLIDESK_CHROME = undefined;
    Bun.env.CHROME_PATH = "/nowhere/chrome";
    expect(launch(800, 600)).rejects.toThrow(NOT_FOUND_MESSAGE);
  });
});
