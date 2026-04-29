import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import loadTemplates from "./loadTemplates";

describe("loadTemplates function", () => {
  it("should return empty object when no templates exist", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    const result = await loadTemplates(tempDir);
    expect(result).toEqual({});
    rmSync(tempDir, { recursive: true });
  });

  it("should load templates from templates directory", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    mkdirSync(`${tempDir}templates`, { recursive: true });
    writeFileSync(`${tempDir}templates/template1.sdt`, "template content 1");
    writeFileSync(`${tempDir}templates/template2.sdt`, "template content 2");

    const result = await loadTemplates(tempDir);
    expect(result.template1).toBe("template content 1");
    expect(result.template2).toBe("template content 2");
    rmSync(tempDir, { recursive: true });
  });

  it("should handle errors gracefully", async () => {
    const result = await loadTemplates("/nonexistent/path");
    expect(result).toEqual({});
  });

  it("should add both full path and filename as keys", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    mkdirSync(`${tempDir}templates/subdir`, { recursive: true });
    writeFileSync(`${tempDir}templates/subdir/myTemplate.sdt`, "content");

    const result = await loadTemplates(tempDir);
    expect(result["subdir/myTemplate"]).toBe("content");
    expect(result.myTemplate).toBe("content");
    rmSync(tempDir, { recursive: true });
  });
});
