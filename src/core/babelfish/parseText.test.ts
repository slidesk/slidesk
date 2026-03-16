import { describe, expect, it } from "bun:test";
import parseText from "./parseText";

describe("parseText function", () => {
  it("should extract content between custom tags", () => {
    const input = "<p>[[section1]]</p><p>Content here</p><p>[[/section1]]</p>";
    const result = parseText(input);
    expect(result).toEqual({ section1: "<p>Content here</p>" });
  });

  it("should extract multiple sections", () => {
    const input =
      "<p>[[intro]]</p><p>Introduction</p><p>[[/intro]]</p><p>[[main]]</p><p>Main content</p><p>[[/main]]</p>";
    const result = parseText(input);
    expect(result).toEqual({
      intro: "<p>Introduction</p>",
      main: "<p>Main content</p>",
    });
  });

  it("should handle empty sections", () => {
    const input = "<p>[[empty]]</p><p>[[/empty]]</p>";
    const result = parseText(input);
    expect(result).toEqual({ empty: "" });
  });

  it("should return empty object when no sections found", () => {
    const input = "<p>Regular paragraph</p>";
    const result = parseText(input);
    expect(result).toEqual({});
  });

  it("should handle multiline content in sections", () => {
    const input =
      "<p>[[section]]</p><p>Line 1</p><p>Line 2</p><p>Line 3</p><p>[[/section]]</p>";
    const result = parseText(input);
    expect(result).toEqual({
      section: "<p>Line 1</p><p>Line 2</p><p>Line 3</p>",
    });
  });

  it("should handle sections with special characters", () => {
    const input =
      "<p>[[section_1]]</p><p>Content with <strong>HTML</strong></p><p>[[/section_1]]</p>";
    const result = parseText(input);
    expect(result).toEqual({
      section_1: "<p>Content with <strong>HTML</strong></p>",
    });
  });
});
