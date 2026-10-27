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

  it("keeps $$ and $& of the talk as written", () => {
    const result = image("!image(price.png, Costs $$ and $& less)");
    expect(result).toContain('alt="Costs $$ and $&amp; less"');
  });

  it("keeps two images on one line apart", () => {
    const result = image("!image(a.png, first) and !image(b.png, second)");
    expect(result).toContain('data-src="a.png" alt="first"');
    expect(result).toContain('data-src="b.png" alt="second"');
    expect(result).toContain(" and <figure");
  });

  it("escapes the alt text, which the caption reuses", () => {
    const result = image('!image(q.png, a "quoted" <word>,,,,true)');
    expect(result).toContain('alt="a &quot;quoted&quot; &lt;word>"');
    expect(result).toContain(">a &quot;quoted&quot; &lt;word></figcaption>");
  });
});
