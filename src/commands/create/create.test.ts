import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  ExitError,
  makeTarball,
  recordingFetch,
  useTempCwd,
} from "../../__testing__/addons";
import { captured } from "../../__testing__/console";
import { runCommand } from "../../utils/cliError";

// question would wait for an answer on stdin
let answer = "";
mock.module("../../utils/interactCLI", () => ({
  question: async () => answer,
  removeCurrentLine: () => {},
  getAction: async () => {},
}));

const exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new ExitError(code);
}) as never);

const { default: createCmd } = await import("./index");

let cwd: ReturnType<typeof useTempCwd>;
let fetchSpy: ReturnType<typeof spyOn> | undefined;

const run = async (argv: string[]) => {
  try {
    return await runCommand(() => createCmd.ready(argv));
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
    return e.code;
  }
};

beforeEach(async () => {
  captured.clear();
  exitSpy.mockClear();
  answer = "My great talk";
  cwd = useTempCwd();
  // create() finishes by pulling the split template from the hub
  const tarball = await makeTarball("split", { "split.sdt": "<div></div>" });
  const { impl } = recordingFetch(async () => new Response(tarball));
  fetchSpy = spyOn(globalThis, "fetch").mockImplementation(impl as never);
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
  cwd.restore();
});

describe("create command", () => {
  it("scaffolds a talk in a slugified directory", async () => {
    expect(await run(["My Talk"])).toBe(0);
    expect(existsSync(join(cwd.dir, "my-talk/main.md"))).toBe(true);
    expect(existsSync(join(cwd.dir, "my-talk/slides/01-speaker.md"))).toBe(
      true,
    );
    expect(existsSync(join(cwd.dir, "my-talk/themes/default/theme.css"))).toBe(
      true,
    );
  });

  it("writes the answered title into main.md", async () => {
    answer = "Fight Club";
    await run(["My Talk"]);
    const main = await Bun.file(join(cwd.dir, "my-talk/main.md")).text();
    expect(main).toContain("Fight Club");
    expect(main).not.toContain("# TITLE");
  });

  it("installs the split template into the new talk", async () => {
    await run(["my-talk"]);
    expect(
      existsSync(join(cwd.dir, "my-talk/templates/@gouz__split/split.sdt")),
    ).toBe(true);
  });

  it("installs the template into the talk when the name is not a slug", async () => {
    await run(["Démo Talk"]);
    expect(existsSync(join(cwd.dir, "demo-talk/main.md"))).toBe(true);
    expect(
      existsSync(join(cwd.dir, "demo-talk/templates/@gouz__split/split.sdt")),
    ).toBe(true);
    expect(readdirSync(cwd.dir)).toEqual(["demo-talk"]);
  });

  it("refuses a directory that is not empty", async () => {
    mkdirSync(join(cwd.dir, "my-talk"));
    writeFileSync(join(cwd.dir, "my-talk/main.md"), "my own talk");
    expect(await run(["my-talk"])).toBe(1);
    expect(captured.error()).toContain(
      "my-talk already exists and is not empty",
    );
    expect(readFileSync(join(cwd.dir, "my-talk/main.md"), "utf8")).toBe(
      "my own talk",
    );
  });

  it("creates the talk when the hub cannot be reached", async () => {
    fetchSpy?.mockImplementation((async () => {
      throw new TypeError("fetch failed");
    }) as never);
    expect(await run(["my-talk"])).toBe(0);
    expect(existsSync(join(cwd.dir, "my-talk/main.md"))).toBe(true);
    expect(captured.log()).toContain("slidesk template install @gouz/split");
  });

  it("tells the user how to start the talk", async () => {
    await run(["My Talk"]);
    expect(captured.log()).toContain("Creation of your talk: My Talk");
    expect(captured.log()).toContain("Presentation created");
    expect(captured.log()).toContain("cd my-talk && slidesk");
  });

  it("avoids naming a directory after the command itself", async () => {
    await run(["create"]);
    expect(existsSync(join(cwd.dir, "create_/main.md"))).toBe(true);
    expect(
      existsSync(join(cwd.dir, "create_/templates/@gouz__split/split.sdt")),
    ).toBe(true);
  });

  it("exits when no name is given", async () => {
    expect(await run([])).toBe(1);
    expect(captured.error()).toContain("You must specify an argument");
  });

  it("exits when the name is blank", async () => {
    expect(await run(["   "])).toBe(1);
    expect(captured.error()).toContain("You must specify an argument");
  });
});
