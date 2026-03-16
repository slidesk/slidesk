import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import loadEnv from "./loadEnv";

describe("loadEnv function", () => {
  it("should return empty object when no .env file exists", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
    const result = await loadEnv(tempDir, {});
    expect(result).toEqual({});
    rmSync(tempDir, { recursive: true });
  });

  it("should return empty object when .env file does not exist with custom conf", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
    const result = await loadEnv(tempDir, { conf: "config" });
    expect(result).toEqual({});
    rmSync(tempDir, { recursive: true });
  });

  it("should parse .env file content", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
    writeFileSync(
      `${tempDir}.env`,
      'TITLE="My Presentation"\nLANG=fr\nHTTPS="true"',
    );

    const result = await loadEnv(tempDir, {});
    expect(result.TITLE).toBe("My Presentation");
    expect(result.LANG).toBe("fr");
    expect(result.HTTPS).toBe("true");
    rmSync(tempDir, { recursive: true });
  });

  it("should handle .env file in custom conf directory", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
    mkdirSync(`${tempDir}config`, { recursive: true });
    writeFileSync(`${tempDir}config/.env`, 'TITLE="Custom Config"');

    const result = await loadEnv(tempDir, { conf: "config" });
    expect(result.TITLE).toBe("Custom Config");
    rmSync(tempDir, { recursive: true });
  });

  it("should handle empty lines in .env file", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
    writeFileSync(`${tempDir}.env`, "TITLE=Test\n\nLANG=en\n");

    const result = await loadEnv(tempDir, {});
    expect(result.TITLE).toBe("Test");
    expect(result.LANG).toBe("en");
    rmSync(tempDir, { recursive: true });
  });
});
