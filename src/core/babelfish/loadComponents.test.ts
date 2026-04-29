import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import loadComponents from "./loadComponents";

describe("loadComponents function", () => {
  it("should return empty array when no components directory exists", () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    const result = loadComponents(tempDir);
    expect(result).toEqual([]);
    rmSync(tempDir, { recursive: true });
  });

  it("should load components from components directory", () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    mkdirSync(`${tempDir}components`, { recursive: true });
    writeFileSync(`${tempDir}components/comp1.mjs`, "");
    writeFileSync(`${tempDir}components/comp2.mjs`, "");
    writeFileSync(`${tempDir}components/readme.txt`, "");

    const result = loadComponents(tempDir);
    expect(result.length).toBe(2);
    expect(result.some((r) => r.includes("comp1.mjs"))).toBe(true);
    expect(result.some((r) => r.includes("comp2.mjs"))).toBe(true);
    rmSync(tempDir, { recursive: true });
  });

  it("should load components from theme directories", () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    mkdirSync(`${tempDir}themes/dark/components`, { recursive: true });
    writeFileSync(`${tempDir}themes/dark/components/themeComp.mjs`, "");

    const result = loadComponents(tempDir);
    expect(
      result.some((r) => r.includes("themes/dark/components/themeComp.mjs")),
    ).toBe(true);
    rmSync(tempDir, { recursive: true });
  });

  it("should filter only .mjs files", () => {
    const tempDir = `${mkdtempSync(tmpdir())}/`;
    mkdirSync(`${tempDir}components`, { recursive: true });
    writeFileSync(`${tempDir}components/comp.mjs`, "");
    writeFileSync(`${tempDir}components/comp.js`, "");
    writeFileSync(`${tempDir}components/comp.ts`, "");

    const result = loadComponents(tempDir);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("comp.mjs");
    rmSync(tempDir, { recursive: true });
  });
});
