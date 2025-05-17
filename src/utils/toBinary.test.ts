import { describe, it, expect } from "bun:test";
import toBinary from "./toBinary";

describe("toBinary function", () => {
  it("should convert a string to binary", () => {
    const input = "hello";
    const expectedOutput = "aABlAGwAbABvAA==";
    expect(toBinary(input)).toBe(expectedOutput);
  });

  it("should handle an empty string", () => {
    const input = "";
    const expectedOutput = "";
    expect(toBinary(input)).toBe(expectedOutput);
  });

  it("should handle a single character", () => {
    const input = "a";
    const expectedOutput = "YQA=";
    expect(toBinary(input)).toBe(expectedOutput);
  });

  it("should handle a string with special characters", () => {
    const input = "!@#$%^&*()";
    const expectedOutput = "IQBAACMAJAAlAF4AJgAqACgAKQA=";
    expect(toBinary(input)).toBe(expectedOutput);
  });

  it("should handle a string with non-ASCII characters", () => {
    const input = "你好";
    const expectedOutput = "YE99WQ==";
    expect(toBinary(input)).toBe(expectedOutput);
  });
});
