import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ExitError, useTempCwd } from "../../__testing__/addons";
import { captured } from "../../__testing__/console";
import deployCmd from "./index";

const exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new ExitError(code);
}) as never);

let cwd: ReturnType<typeof useTempCwd>;

const run = async (argv: string[]) => {
  try {
    await deployCmd.ready(argv);
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
    return e.code;
  }
  return undefined;
};

beforeEach(() => {
  captured.clear();
  exitSpy.mockClear();
  cwd = useTempCwd();
});

afterEach(() => {
  cwd.restore();
});

describe("deploy command", () => {
  it("writes a github workflow", async () => {
    expect(await run(["--target", "github"])).toBe(0);
    const file = join(cwd.dir, ".github/workflows/slidesk.yml");
    expect(existsSync(file)).toBe(true);
    expect(await Bun.file(file).text()).toContain("slidesk");
  });

  it("writes a gitlab pipeline", async () => {
    expect(await run(["--target", "gitlab"])).toBe(0);
    expect(existsSync(join(cwd.dir, ".gitlab-ci.yml"))).toBe(true);
  });

  it("writes a slidesk.link manifest", async () => {
    expect(await run(["--target", "link"])).toBe(0);
    expect(existsSync(join(cwd.dir, "link.yml"))).toBe(true);
  });

  it("writes into the named talk directory", async () => {
    expect(await run(["my-talk", "--target", "gitlab"])).toBe(0);
    expect(existsSync(join(cwd.dir, "my-talk/.gitlab-ci.yml"))).toBe(true);
  });

  it("rejects an unknown target", async () => {
    expect(await run(["--target", "netlify"])).toBe(1);
    expect(captured.error()).toContain("netlify is not a valid deploy option");
  });

  it("rejects a missing target", async () => {
    expect(await run([])).toBe(1);
    expect(captured.error()).toContain("is not a valid deploy option");
  });

  it("documents its target option", () => {
    const help = deployCmd.helpText();
    expect(help).toContain("--target");
    expect(help).toContain("github");
    expect(help).toContain("gitlab");
  });
});
