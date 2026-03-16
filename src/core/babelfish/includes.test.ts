import { describe, expect, it } from "bun:test";
import includes from "./includes";

describe("includes function", () => {
  it("should return empty string when file path is outside cwd", async () => {
    const result = await includes("/outside/path/file.sdf");
    expect(result).toBe("");
  });
});
