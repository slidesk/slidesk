import { describe, expect, it } from "bun:test";
import image from "./image";

describe("image function", () => {
  it("should export a function", () => {
    expect(typeof image).toBe("function");
  });

  it("should convert !image syntax to figure", () => {
    const input = "!image(photo.jpg, A beautiful sunset)";
    const result = image(input);
    expect(result).toContain("<figure");
  });

  it("should handle width parameter", () => {
    const input = "!image(photo.jpg, Alt text, 800)";
    const result = image(input);
    expect(result).toContain('width="800"');
  });

  it("should return original string when no !image syntax", () => {
    const input = "Regular text with no image syntax";
    const result = image(input);
    expect(result).toBe("Regular text with no image syntax");
  });
});
