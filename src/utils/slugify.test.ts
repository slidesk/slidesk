import { describe, expect, it } from "bun:test";
import slugify from "./slugify";

describe("slugify function", () => {
  it("should convert a string to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should trim the string", () => {
    expect(slugify("   Hello World   ")).toBe("hello-world");
  });

  it("should remove non-word characters", () => {
    expect(slugify("Hello World!@#")).toBe("hello-world");
  });

  it("should replace spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should handle multiple spaces and hyphens", () => {
    expect(slugify("Hello   World")).toBe("hello-world");
  });

  it("should handle special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("should handle empty string", () => {
    expect(slugify("")).toBe("");
  });
});
