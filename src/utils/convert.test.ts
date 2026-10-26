import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { captured } from "../__testing__/console";
import convert from "./convert";

const fixtures = join(import.meta.dir, "../__fixtures__");
const fixture = join(fixtures, "talk");
// includes() only reads files below the current working directory, so the
// throwaway talks have to live inside the repository.
const scratch = join(fixtures, ".tmp-convert");
mkdirSync(scratch, { recursive: true });

afterAll(() => {
  rmSync(scratch, { recursive: true, force: true });
});

beforeEach(() => {
  captured.clear();
});

describe("convert", () => {
  it("builds the talk from main.sdf", async () => {
    const files = await convert(fixture, {}, {});
    expect(files["index.html"].content).toContain("Welcome");
    expect(captured.errors).toEqual([]);
  });

  it("builds the talk from main.md when there is no main.sdf", async () => {
    const dir = mkdtempSync(join(scratch, "md-"));
    writeFileSync(join(dir, "main.md"), "## From markdown\n");
    const files = await convert(dir, {}, {});
    expect(files["index.html"].content).toContain("From markdown");
  });

  it("fails when no main file is found", async () => {
    const dir = mkdtempSync(join(tmpdir(), "slidesk-empty-"));
    expect(convert(dir, {}, {})).rejects.toThrow("main.(sdf|md) was not found");
    rmSync(dir, { recursive: true, force: true });
  });

  it("falls back to the error presentation when asked to", async () => {
    const dir = mkdtempSync(join(scratch, "broken-"));
    writeFileSync(join(dir, "main.sdf"), "## Broken\n\n!include(missing)\n");
    const files = await convert(dir, {}, {}, true);
    expect(files["index.html"].content).toContain("ERROR");
    expect(captured.error()).toContain("missing not found");
  });

  it("fails on a broken talk otherwise", async () => {
    const dir = mkdtempSync(join(scratch, "broken-"));
    writeFileSync(join(dir, "main.sdf"), "## Broken\n\n!include(missing)\n");
    expect(convert(dir, {}, {})).rejects.toThrow("missing not found");
  });
});
