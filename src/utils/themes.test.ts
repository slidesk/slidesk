import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inTheme, themeNames } from "./themes";

describe("themeNames", () => {
  it("lists every theme, or only the chosen one, which must exist", () => {
    const dir = mkdtempSync(join(tmpdir(), "slidesk-test-"));
    expect(themeNames(dir)).toEqual([]);
    mkdirSync(`${dir}/themes/light`, { recursive: true });
    mkdirSync(`${dir}/themes/dark`);
    expect(themeNames(dir)).toEqual(["dark", "light"]);
    expect(themeNames(dir, "light")).toEqual(["light"]);
    expect(() => themeNames(dir, "blue")).toThrow(
      "theme blue not found (available: dark, light)",
    );
    rmSync(dir, { recursive: true });
  });

  it("keeps only the files of the chosen theme", () => {
    expect(inTheme("dark/theme.css")).toBe(true);
    expect(inTheme("dark/theme.css", "dark")).toBe(true);
    expect(inTheme("darker/theme.css", "dark")).toBe(false);
  });
});
