import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import save from "./save";

const fixtures = join(import.meta.dir, "../__fixtures__");
const fixture = join(fixtures, "talk");
const scratch = join(fixtures, ".tmp-save");

beforeEach(() => {
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(scratch, { recursive: true });
});

afterAll(() => {
  rmSync(scratch, { recursive: true, force: true });
});

describe("save", () => {
  it("writes the generated presentation to the target directory", async () => {
    const target = join(scratch, "out");
    await save(fixture, { target });
    expect(existsSync(join(target, "index.html"))).toBe(true);
    expect(existsSync(join(target, "notes.html"))).toBe(true);
    expect(existsSync(join(target, "slidesk.css"))).toBe(true);
    expect(existsSync(join(target, "slidesk.js"))).toBe(true);
    expect(await Bun.file(join(target, "index.html")).text()).toContain(
      "Welcome",
    );
  });

  it("copies the talk assets but not its sources", async () => {
    const target = join(scratch, "assets");
    await save(fixture, { target });
    expect(existsSync(join(target, "templates/tpl.css"))).toBe(true);
    expect(existsSync(join(target, "themes/dark/theme.css"))).toBe(true);
    expect(existsSync(join(target, "main.sdf"))).toBe(false);
    expect(existsSync(join(target, "slides/02-more.md"))).toBe(false);
    expect(existsSync(join(target, "templates/box.sdt"))).toBe(false);
    expect(existsSync(join(target, "plugins/demo/plugin.json"))).toBe(false);
  });

  it("wipes an existing target directory first", async () => {
    const target = join(scratch, "stale");
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, "index.html"), "old");
    writeFileSync(join(target, "leftover.txt"), "old");
    await save(fixture, { target });
    expect(existsSync(join(target, "leftover.txt"))).toBe(false);
    expect(existsSync(join(target, "index.html"))).toBe(true);
  });

  it("refuses to save into the talk directory itself", async () => {
    expect(save(fixture, { target: fixture })).rejects.toThrow(
      "not possible to save to the root",
    );
  });

  it("refuses to wipe a parent of the talk", async () => {
    expect(save(fixture, { target: join(fixture, "..") })).rejects.toThrow(
      "not possible to save to the root",
    );
    expect(save(fixture, { target: "/" })).rejects.toThrow(
      "not possible to save to the root",
    );
    expect(existsSync(join(fixture, "main.sdf"))).toBe(true);
  });

  it("refuses to wipe a directory that is not an export", async () => {
    const target = join(scratch, "src");
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, "code.ts"), "precious");
    expect(save(fixture, { target })).rejects.toThrow(
      "is not a SliDesk export",
    );
    expect(existsSync(join(target, "code.ts"))).toBe(true);
  });

  it("refuses to replace a file", async () => {
    const target = join(scratch, "file.txt");
    writeFileSync(target, "precious");
    expect(save(fixture, { target })).rejects.toThrow(
      "is not a SliDesk export",
    );
  });

  it("leaves the components out of the export", async () => {
    const target = join(scratch, "nocomponents");
    await save(fixture, { target });
    expect(existsSync(join(target, "components"))).toBe(false);
  });

  it("refuses to save into the current directory", async () => {
    expect(save(fixture, { target: "." })).rejects.toThrow(
      "not possible to save to the root",
    );
  });

  it("leaves the talk untouched when the guard fires", async () => {
    await save(fixture, { target: fixture }).catch(() => {});
    expect(existsSync(join(fixture, "main.sdf"))).toBe(true);
    expect(existsSync(join(fixture, "slides/01-intro.sdf"))).toBe(true);
  });

  it("merges the additional env into the talk configuration", async () => {
    const target = join(scratch, "env");
    await save(fixture, { target }, { slidesk: { TITLE: "Overridden" } });
    expect(existsSync(join(target, "index.html"))).toBe(true);
  });
});
