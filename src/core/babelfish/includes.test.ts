import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import includes from "./includes";

const fixture = join(import.meta.dir, "../../__fixtures__/talk");

describe("includes function", () => {
  it("should return empty string when file path is outside cwd", async () => {
    const result = await includes("/outside/path/file.sdf");
    expect(result).toBe("");
  });

  it("reads a file that has no include directive", async () => {
    const result = await includes(`${fixture}/slides/01-intro.sdf`);
    expect(result).toContain("## Intro");
    expect(result).toContain("Hello **world**");
  });

  it("expands a directory include with the default extensions", async () => {
    const result = await includes(`${fixture}/main.sdf`);
    expect(result).toContain("## Intro");
    expect(result).toContain("## More");
  });

  it("restricts a directory include to the given extensions", async () => {
    const result = await includes(`${fixture}/only-md.sdf`);
    expect(result).toContain("## More");
    expect(result).not.toContain("## Intro");
  });

  it("expands an include pointing at a single file", async () => {
    const result = await includes(`${fixture}/single-include.sdf`);
    expect(result).toContain("## Intro");
    expect(result).not.toContain("## More");
  });
});
