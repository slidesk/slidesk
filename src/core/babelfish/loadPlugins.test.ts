import { beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { captured } from "../../__testing__/console";
import loadPlugins from "./loadPlugins";

beforeEach(() => {
  captured.clear();
});

describe("loadPlugins function", () => {
  it("skips a plugin whose plugin.json is being written", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
    mkdirSync(`${tempDir}plugins/draft`, { recursive: true });
    mkdirSync(`${tempDir}plugins/ready`, { recursive: true });
    writeFileSync(`${tempDir}plugins/draft/plugin.json`, '{"addHTML":');
    writeFileSync(`${tempDir}plugins/ready/plugin.json`, "{}");
    const result = await loadPlugins(tempDir, {});
    expect(result.map((p) => p.name)).toEqual(["ready"]);
    expect(String(captured.warns)).toContain("draft/plugin.json skipped");
    rmSync(tempDir, { recursive: true });
  });

  it("skips a plugin naming an html file that does not exist yet", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
    mkdirSync(`${tempDir}plugins/draft`, { recursive: true });
    writeFileSync(
      `${tempDir}plugins/draft/plugin.json`,
      JSON.stringify({ addHTMLFromFiles: ["plugins/draft/todo.html"] }),
    );
    expect(await loadPlugins(tempDir, {})).toEqual([]);
    expect(String(captured.warns)).toContain("skipped");
    rmSync(tempDir, { recursive: true });
  });

  it("should return empty array when no plugins directory exists", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
    const env: Record<string, unknown> = { slidesk: { COMMON_DIR: "" } };
    const result = await loadPlugins(tempDir, env);
    expect(result).toEqual([]);
    rmSync(tempDir, { recursive: true });
  });

  it("should load plugins from plugins directory", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
    mkdirSync(`${tempDir}plugins/myplugin`, { recursive: true });
    writeFileSync(
      `${tempDir}plugins/myplugin/plugin.json`,
      JSON.stringify({ addHTML: "", addScripts: [], addStyles: [] }),
    );

    const env: Record<string, unknown> = { COMMON_DIR: "" };
    const result = await loadPlugins(tempDir, env);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("myplugin");
    rmSync(tempDir, { recursive: true });
  });

  it("should load plugins from common directory", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
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

    const env: Record<string, unknown> = { slidesk: { COMMON_DIR: "common" } };
    const result = await loadPlugins(tempDir, env);
    expect(result).toHaveLength(2);
    rmSync(tempDir, { recursive: true });
  });

  it("should load plugins from theme directories", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
    mkdirSync(`${tempDir}themes/dark/plugins/themePlugin`, { recursive: true });
    writeFileSync(
      `${tempDir}themes/dark/plugins/themePlugin/plugin.json`,
      JSON.stringify({ addHTML: "", addScripts: [], addStyles: [] }),
    );

    const env: Record<string, unknown> = { slidesk: { COMMON_DIR: "" } };
    const result = await loadPlugins(tempDir, env);
    expect(result).toHaveLength(1);
    expect(result[0].theme).toBe("/themes/dark/");
    rmSync(tempDir, { recursive: true });
  });

  it("should handle addHTMLFromFiles", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
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

    const env: Record<string, unknown> = { slidesk: { COMMON_DIR: "" } };
    const result = await loadPlugins(tempDir, env);
    expect(result).toHaveLength(1);
    expect(result[0].addHTMLFromFiles).toBeDefined();
    expect(
      (result[0].addHTMLFromFiles as Record<string, string>)[
        "templates/extra.html"
      ],
    ).toContain("extra");
    rmSync(tempDir, { recursive: true });
  });
});
