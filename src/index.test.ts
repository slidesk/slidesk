import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import packagejson from "../package.json";

/**
 * Every path through the entry point ends in process.exit, and neutralising it
 * is not an option here: Clipse falls through to the default command, which
 * would run `present` against the current directory. So the CLI is run the way
 * a user runs it, in a throwaway directory.
 *
 * The trade-off is that this process is not the one bun measures, so
 * src/index.ts stays outside the coverage report.
 */

const entry = join(import.meta.dir, "index.ts");
let cwd: string;

const run = async (args: string[]) => {
  const proc = Bun.spawn(["bun", entry, ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
};

beforeAll(() => {
  cwd = mkdtempSync(join(tmpdir(), "slidesk-cli-"));
});

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true });
});

describe("slidesk", () => {
  it("prints the banner with the current version", async () => {
    const { stdout } = await run(["--help"]);
    expect(stdout).toContain("SliDesk");
    expect(stdout).toContain(packagejson.version);
  });

  it("lists every subcommand", async () => {
    const { stdout } = await run(["--help"]);
    for (const command of [
      "create",
      "plugin",
      "component",
      "link",
      "template",
      "theme",
      "deploy",
      "save",
      "export",
      "import",
      "present",
      "skills",
    ])
      expect(stdout).toContain(command);
  });

  it("describes itself", async () => {
    const { stdout } = await run(["--help"]);
    expect(stdout).toContain("Your presentation companion");
  });

  it("exposes the subcommands it wires in", async () => {
    const { stdout } = await run(["deploy", "--help"]);
    expect(stdout).toContain("--target");
  });

  it("refuses to present a directory that holds no talk", async () => {
    const { stderr, exitCode } = await run([]);
    expect(stderr).toContain("main.(sdf|md) was not found");
    expect(exitCode).toBe(1);
  });
}, 30000);
