import { describe, expect, it } from "bun:test";
import getCSS from "./getCSS";

describe("getCSS function", () => {
  it("should include animation timer from env", () => {
    const options = { domain: "localhost" };
    const result = getCSS(options, { ANIMATION_TIMER: "500" });
    expect(result).toContain("--animationTimer: 500ms");
  });

  it("should include animation timer from options", () => {
    const options = { domain: "localhost", transition: "400" };
    const result = getCSS(options, {});
    expect(result).toContain("--animationTimer: 400ms");
  });

  it("should default animation timer to 300", () => {
    const options = { domain: "localhost" };
    const result = getCSS(options, {});
    expect(result).toContain("--animationTimer: 300ms");
  });

  it("should preserve original styles", () => {
    const options = { domain: "localhost" };
    const result = getCSS(options, {});
    expect(result).toContain(":root");
  });
});
