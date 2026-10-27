import { beforeEach, describe, expect, it } from "bun:test";
import { captured } from "../__testing__/console";
import envVariables from "./envVariables";

beforeEach(() => {
  captured.clear();
});

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

  it("leaves a key missing from the configuration visible, with a warning", () => {
    expect(envVariables("Hello ++NAME++", {})).toBe("Hello ++NAME++");
    expect(String(captured.warns)).toContain("++NAME++ is not set");
  });

  it("should handle odd number of ++ (invalid syntax)", () => {
    const result = envVariables("Hello ++NAME", { NAME: "World" });
    expect(result).toBe("Hello ++NAME");
  });

  it("reads a key of a section", () => {
    expect(envVariables("By ++info.NAME++", { info: { NAME: "Me" } })).toBe(
      "By Me",
    );
  });

  it("leaves text that only contains ++ alone", () => {
    expect(envVariables("C++ vs C++ en 2026", { C: "x" })).toBe(
      "C++ vs C++ en 2026",
    );
    expect(envVariables("for (;; i++) j++;", {})).toBe("for (;; i++) j++;");
    expect(captured.warns).toEqual([]);
  });

  it("keeps a falsy value", () => {
    expect(envVariables("++N++ / ++B++", { N: 0, B: false })).toBe("0 / false");
  });
});
