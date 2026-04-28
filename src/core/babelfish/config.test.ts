import { describe, expect, it } from "bun:test";
import config from "./config";

describe("config function", () => {
  it("should parse add_styles config", () => {
    const input = "add_styles: /style1.css, /style2.css";
    const result = config(input);
    expect(result.css).toHaveLength(2);
    expect(result.css[0]).toContain("style1.css");
  });

  it("should parse add_scripts config", () => {
    const input = "add_scripts: /script1.js, /script2.js";
    const result = config(input);
    expect(result.js).toHaveLength(2);
    expect(result.js[0]).toContain("script1.js");
  });

  it("should handle multiple config options", () => {
    const input = `add_styles: /style1.css
add_scripts: /script1.js`;
    const result = config(input);
    expect(result.css).toHaveLength(1);
    expect(result.js).toHaveLength(1);
  });

  it("should handle empty input", () => {
    const result = config("");
    expect(result.css).toEqual([]);
    expect(result.js).toEqual([]);
  });
});
