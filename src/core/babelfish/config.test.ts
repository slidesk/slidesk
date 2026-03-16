import { describe, expect, it } from "bun:test";
import config from "./config";

describe("config function", () => {
  it("should parse custom_css config", () => {
    const input = "custom_css: /path/to/style.css";
    const result = config(input);
    expect(result.customCSS).toContain("<link");
    expect(result.customCSS).toContain('href="/path/to/style.css"');
  });

  it("should parse add_styles config", () => {
    const input = "add_styles: /style1.css, /style2.css";
    const result = config(input);
    expect(result.customIncludes.css).toHaveLength(2);
    expect(result.customIncludes.css[0]).toContain("style1.css");
  });

  it("should parse add_scripts config", () => {
    const input = "add_scripts: /script1.js, /script2.js";
    const result = config(input);
    expect(result.customIncludes.js).toHaveLength(2);
    expect(result.customIncludes.js[0]).toContain("script1.js");
  });

  it("should handle multiple config options", () => {
    const input = `custom_css: /style.css
add_styles: /style1.css
add_scripts: /script1.js`;
    const result = config(input);
    expect(result.customCSS).toContain("style.css");
    expect(result.customIncludes.css).toHaveLength(1);
    expect(result.customIncludes.js).toHaveLength(1);
  });

  it("should handle empty input", () => {
    const result = config("");
    expect(result.customCSS).toBe("");
    expect(result.customIncludes.css).toEqual([]);
    expect(result.customIncludes.js).toEqual([]);
  });

  it("should handle lines with leading whitespace", () => {
    const input = "custom_css:  /style.css";
    const result = config(input);
    expect(result.customCSS).toContain("/style.css");
  });
});
