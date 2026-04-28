import { describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import preload from "./preload";

describe("preload function", () => {
  it("should load all resources from sdfPath", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;

    const result = await preload(tempDir, {});

    expect(result).toBeDefined();
    expect(result.plugins).toBeDefined();
    expect(result.templates).toBeDefined();
    expect(result.favicon).toBeDefined();
    expect(result.components).toBeDefined();

    rmSync(tempDir, { recursive: true });
  });
});
