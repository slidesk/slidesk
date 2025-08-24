import { describe, expect, it, mock } from "bun:test";
import start from "./start";

describe("start function", () => {
  it('should return "open" for macOS', () => {
    mock.module("node:process", () => ({
      platform: "darwin",
    }));
    expect(start()).toBe("open");
  });

  it('should return "start" for Windows', () => {
    mock.module("node:process", () => ({
      platform: "win32",
    }));
    expect(start()).toBe("start");
  });

  it('should return "xdg-open" for other platforms', () => {
    mock.module("node:process", () => ({
      platform: "linux",
    }));
    expect(start()).toBe("xdg-open");
  });

  it("should handle an unknown platform", () => {
    mock.module("node:process", () => ({
      platform: "unknown",
    }));
    expect(start()).toBe("xdg-open");
  });
});
