import { describe, expect, it } from "bun:test";
import formatting from "./formatting";

describe("formatting function", () => {
  it("should process each line with envVariables", () => {
    const result = formatting("Line1\nLine2", {});
    expect(result).toBe("Line1\nLine2");
  });

  it("should handle multiple lines with variables", () => {
    const result = formatting("Hello ++NAME++\nGoodbye ++NAME++", {
      NAME: "World",
    });
    expect(result).toBe("Hello World\nGoodbye World");
  });

  it("should preserve empty lines", () => {
    const result = formatting("Line1\n\nLine2", {});
    expect(result).toBe("Line1\n\nLine2");
  });
});
