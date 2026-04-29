import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import loadEnv from "./loadEnv";

describe("loadEnv function", () => {
  it("should return empty object when no slidesk.toml file exists", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    const result = await loadEnv(tempDir, {});
    expect(result).toEqual({});
    rmSync(tempDir, { recursive: true });
  });

  it("should return empty object when slidesk.toml file does not exist with custom conf", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    const result = await loadEnv(tempDir, { conf: "config" });
    expect(result).toEqual({});
    rmSync(tempDir, { recursive: true });
  });

  it("should parse slidesk.toml file content", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    writeFileSync(
      `${tempDir}slidesk.toml`,
      'TITLE="My Presentation"\nLANG=fr\nHTTPS="true"',
    );

    const result = (await loadEnv(tempDir, {})) as {
      TITLE: string;
      LANG: string;
      HTTPS: string;
    };
    expect(result.TITLE).toBe("My Presentation");
    expect(result.LANG).toBe("fr");
    expect(result.HTTPS).toBe("true");
    rmSync(tempDir, { recursive: true });
  });

  it("should handle slidesk.toml file in custom conf directory", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    mkdirSync(`${tempDir}config`, { recursive: true });
    writeFileSync(`${tempDir}config/slidesk.toml`, 'TITLE="Custom Config"');

    const result = (await loadEnv(tempDir, {
      conf: "config/slidesk.toml",
    })) as {
      TITLE: string;
    };
    expect(result.TITLE).toBe("Custom Config");
    rmSync(tempDir, { recursive: true });
  });

  it("should handle empty lines in slidesk.toml file", async () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    writeFileSync(`${tempDir}slidesk.toml`, "TITLE=Test\n\nLANG=en\n");

    const result = (await loadEnv(tempDir, {})) as {
      TITLE: string;
      LANG: string;
    };
    expect(result.TITLE).toBe("Test");
    expect(result.LANG).toBe("en");
    rmSync(tempDir, { recursive: true });
  });
});
