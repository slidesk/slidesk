import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import type { SliDeskEnv } from "../../types";
import loadPlugins from "./loadPlugins";

describe("loadPlugins function", () => {
  it("should return empty array when no plugins directory exists", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
    const env: SliDeskEnv = { COMMON_DIR: "" };
    const result = await loadPlugins(tempDir, env);
    expect(result).toEqual([]);
    rmSync(tempDir, { recursive: true });
  });

  it("should load plugins from plugins directory", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
    mkdirSync(`${tempDir}plugins/myplugin`, { recursive: true });
    writeFileSync(
      `${tempDir}plugins/myplugin/plugin.json`,
      JSON.stringify({ addHTML: "", addScripts: [], addStyles: [] }),
    );

    const env: SliDeskEnv = { COMMON_DIR: "" };
    const result = await loadPlugins(tempDir, env);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("myplugin");
    rmSync(tempDir, { recursive: true });
  });

  it("should load plugins from common directory", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
    mkdirSync(`${tempDir}plugins/plugin1`, { recursive: true });
    mkdirSync(`${tempDir}common/plugins/commonPlugin`, { recursive: true });
    writeFileSync(
      `${tempDir}plugins/plugin1/plugin.json`,
      JSON.stringify({ addHTML: "", addScripts: [], addStyles: [] }),
    );
    writeFileSync(
      `${tempDir}common/plugins/commonPlugin/plugin.json`,
      JSON.stringify({ addHTML: "", addScripts: [], addStyles: [] }),
    );

    const env: SliDeskEnv = { COMMON_DIR: "common" };
    const result = await loadPlugins(tempDir, env);
    expect(result).toHaveLength(2);
    rmSync(tempDir, { recursive: true });
  });

  it("should load plugins from theme directories", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
    mkdirSync(`${tempDir}themes/dark/plugins/themePlugin`, { recursive: true });
    writeFileSync(
      `${tempDir}themes/dark/plugins/themePlugin/plugin.json`,
      JSON.stringify({ addHTML: "", addScripts: [], addStyles: [] }),
    );

    const env: SliDeskEnv = { COMMON_DIR: "" };
    const result = await loadPlugins(tempDir, env);
    expect(result).toHaveLength(1);
    expect(result[0].theme).toBe("/themes/dark/");
    rmSync(tempDir, { recursive: true });
  });

  it("should handle addHTMLFromFiles", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
    mkdirSync(`${tempDir}plugins/myplugin`, { recursive: true });
    mkdirSync(`${tempDir}templates`, { recursive: true });
    writeFileSync(`${tempDir}templates/extra.html`, "<div>extra</div>");
    writeFileSync(
      `${tempDir}plugins/myplugin/plugin.json`,
      JSON.stringify({
        addHTML: "",
        addScripts: [],
        addStyles: [],
        addHTMLFromFiles: ["templates/extra.html"],
      }),
    );

    const env: SliDeskEnv = { COMMON_DIR: "" };
    const result = await loadPlugins(tempDir, env);
    expect(result).toHaveLength(1);
    expect(result[0].addHTMLFromFiles).toBeDefined();
    expect(result[0].addHTMLFromFiles["templates/extra.html"]).toContain(
      "extra",
    );
    rmSync(tempDir, { recursive: true });
  });
});
