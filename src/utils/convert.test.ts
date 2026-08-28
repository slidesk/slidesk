import { afterAll, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { captured } from "../__testing__/console";

class ExitError extends Error {
  constructor(readonly code?: number) {
    super(`process.exit(${code})`);
  }
}
const exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new ExitError(code);
}) as never);

const { default: convert } = await import("./convert");

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
  exitSpy.mockClear();
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

  it("exits when no main file is found", async () => {
    const dir = mkdtempSync(join(tmpdir(), "slidesk-empty-"));
    // the exit is raised inside convert's try block, so it lands in the
    // error presentation fallback instead of propagating
    await convert(dir, {}, {});
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(captured.error()).toContain("main.(sdf|md) was not found");
    rmSync(dir, { recursive: true, force: true });
  });

  it("falls back to the error presentation when the build throws", async () => {
    const dir = mkdtempSync(join(scratch, "broken-"));
    writeFileSync(join(dir, "main.sdf"), "## Broken\n\n!include(missing)\n");
    const files = await convert(dir, {}, {});
    expect(files["index.html"].content).toContain("ERROR");
    expect(captured.errors).not.toEqual([]);
  });
});
