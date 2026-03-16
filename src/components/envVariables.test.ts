import { describe, expect, it } from "bun:test";
import envVariables from "./envVariables";

describe("envVariables function", () => {
  it("should replace ++variable++ with env value", () => {
    const result = envVariables("Hello ++NAME++", { NAME: "World" });
    expect(result).toBe("Hello World");
  });

  it("should handle multiple variables", () => {
    const result = envVariables("Hello ++NAME++ and ++OTHER++", {
      NAME: "World",
      OTHER: "Friend",
    });
    expect(result).toBe("Hello World and Friend");
  });

  it("should return original string if no variables", () => {
    const result = envVariables("Hello World", { NAME: "World" });
    expect(result).toBe("Hello World");
  });

  it("should return empty string if variable not found in env", () => {
    const result = envVariables("Hello ++NAME++", {});
    expect(result).toBe("Hello ");
  });

  it("should handle odd number of ++ (invalid syntax)", () => {
    const result = envVariables("Hello ++NAME", { NAME: "World" });
    expect(result).toBe("Hello ++NAME");
  });

  it("should handle empty env object", () => {
    const result = envVariables("Hello ++NAME++", {});
    expect(result).toBe("Hello ");
  });
});
