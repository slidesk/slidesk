import { describe, expect, it } from "bun:test";
import getCSS from "./getCSS";

describe("getCSS function", () => {
  it("should include animation timer from env", () => {
    const result = getCSS({ slidesk: { TRANSITION: 500 } });
    expect(result).toContain("--animationTimer: 500ms");
  });

  it("should default animation timer to 300", () => {
    const result = getCSS({});
    expect(result).toContain("--animationTimer: 300ms");
  });

  it("should preserve original styles", () => {
    const result = getCSS({});
    expect(result).toContain(":root");
  });
});
