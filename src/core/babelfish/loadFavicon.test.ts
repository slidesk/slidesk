import { describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import loadFavicon from "./loadFavicon";

describe("loadFavicon function", () => {
  it("should return default favicon when none exist", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    const result = await loadFavicon(tempDir);
    expect(result.name).toBe("favicon.svg");
    expect(result.type).toBe("image/svg+xml");
    rmSync(tempDir, { recursive: true });
  });

  it("should return favicon.ico when it exists", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    writeFileSync(`${tempDir}favicon.ico`, new Uint8Array([1, 2, 3]));

    const result = await loadFavicon(tempDir);
    expect(result.name).toBe("favicon.ico");
    expect(result.type).toBe("image/x-icon");
    rmSync(tempDir, { recursive: true });
  });

  it("should return favicon.png when svg and ico do not exist but png exists", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    writeFileSync(`${tempDir}favicon.png`, new Uint8Array([1, 2, 3]));

    const result = await loadFavicon(tempDir);
    expect(result.name).toBe("favicon.png");
    expect(result.type).toBe("image/png");
    rmSync(tempDir, { recursive: true });
  });
});
