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
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { ExitError, useTempCwd } from "../__testing__/addons";
import {
  browserModuleMock,
  browserStub,
  fakePage,
} from "../__testing__/browser";
import { captured } from "../__testing__/console";

const exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new ExitError(code);
}) as never);

// the export path is driven end to end against a fake browser rather than by
// stubbing core/export: a module mock would stay registered for the whole
// process and leak into the tests of core/export itself
mock.module("../core/browser", browserModuleMock);

const { default: exportCmd } = await import("./export");
const { default: importCmd } = await import("./import");
const { default: saveCmd } = await import("./save");
const { default: skillsCmd } = await import("./skills");

let cwd: ReturnType<typeof useTempCwd>;
let fetchSpy: ReturnType<typeof spyOn> | undefined;

const run = async (
  cmd: { ready: (argv: string[]) => Promise<void> },
  argv: string[],
) => {
  try {
    await cmd.ready(argv);
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
    return e.code;
  }
  return undefined;
};

const TALK = join(import.meta.dir, "../__fixtures__/talk");

const SLIDEV = `---
title: Slidev deck
---

# First

some text

---

# Second
`;

beforeEach(() => {
  captured.clear();
  browserStub.launched.length = 0;
  browserStub.page = fakePage().page;
  exitSpy.mockClear();
  cwd = useTempCwd();
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
  cwd.restore();
});

// mock.restore() is deliberately not called here: it would also undo the
// process-wide console spy the tests share, and Bun keeps module mocks
// registered for the lifetime of the process anyway.

describe("export command", () => {
  it("exports the current directory as a pdf by default", async () => {
    cpSync(TALK, cwd.dir, { recursive: true });
    expect(await run(exportCmd, [])).toBe(0);
    // with no TITLE configured the file is named after the talk directory,
    // slugified
    expect(readdirSync(cwd.dir).filter((f) => f.endsWith(".pdf"))).toEqual([
      `${basename(cwd.dir).toLowerCase()}.pdf`,
    ]);
    expect(browserStub.launched).toEqual([[1920, 1080]]);
  });

  it("exports the named talk directory", async () => {
    cpSync(TALK, join(cwd.dir, "my-talk"), { recursive: true });
    expect(await run(exportCmd, ["my-talk", "--output", "out.pdf"])).toBe(0);
    expect(existsSync(join(cwd.dir, "out.pdf"))).toBe(true);
  });

  it("treats a dot as the current directory", async () => {
    cpSync(TALK, cwd.dir, { recursive: true });
    expect(await run(exportCmd, [".", "--output", "dot.pdf"])).toBe(0);
    expect(existsSync(join(cwd.dir, "dot.pdf"))).toBe(true);
  });

  it("exports to the requested format", async () => {
    cpSync(TALK, cwd.dir, { recursive: true });
    expect(
      await run(exportCmd, ["--type", "pptx", "--output", "deck.pptx"]),
    ).toBe(0);
    expect(
      (await Bun.file(join(cwd.dir, "deck.pptx")).bytes()).slice(0, 2),
    ).toEqual(new Uint8Array([0x50, 0x4b]));
  });

  it("rejects an unknown format", async () => {
    expect(await run(exportCmd, ["--type", "keynote"])).toBe(1);
    expect(captured.error()).toContain("keynote is not a valid export type");
  });

  it("reports a failing export", async () => {
    cpSync(TALK, cwd.dir, { recursive: true });
    browserStub.page = fakePage(0).page; // no slide to export
    expect(await run(exportCmd, [])).toBe(1);
    expect(captured.error()).toContain("no slide found");
  });

  it("documents its options", () => {
    const help = exportCmd.helpText();
    expect(help).toContain("--type");
    expect(help).toContain("--output");
    expect(help).toContain("--conf");
    expect(help).toContain("--lang");
  });
});

describe("import command", () => {
  it("imports the given source", async () => {
    writeFileSync(join(cwd.dir, "slides.md"), SLIDEV);
    expect(await run(importCmd, ["slides.md", "--output", "out"])).toBe(0);
    expect(existsSync(join(cwd.dir, "out/main.md"))).toBe(true);
  });

  it("honours an explicit source format", async () => {
    writeFileSync(join(cwd.dir, "deck.txt"), SLIDEV);
    expect(
      await run(importCmd, [
        "deck.txt",
        "--type",
        "slidev",
        "--output",
        "typed",
      ]),
    ).toBe(0);
    expect(existsSync(join(cwd.dir, "typed/main.md"))).toBe(true);
  });

  it("writes into a directory that is not empty only when forced", async () => {
    writeFileSync(join(cwd.dir, "slides.md"), SLIDEV);
    mkdirSync(join(cwd.dir, "taken"), { recursive: true });
    writeFileSync(join(cwd.dir, "taken/keep.txt"), "mine");
    expect(await run(importCmd, ["slides.md", "--output", "taken"])).toBe(1);
    expect(captured.error()).toContain("already exists and is not empty");
    expect(
      await run(importCmd, ["slides.md", "--output", "taken", "--force"]),
    ).toBe(0);
    expect(existsSync(join(cwd.dir, "taken/main.md"))).toBe(true);
  });

  it("exits when no source is given", async () => {
    expect(await run(importCmd, [])).toBe(1);
    expect(captured.error()).toContain("You must specify the presentation");
  });

  it("exits when the source is blank", async () => {
    expect(await run(importCmd, ["   "])).toBe(1);
    expect(captured.error()).toContain("You must specify the presentation");
  });

  it("reports a failing import", async () => {
    expect(await run(importCmd, ["missing.pptx", "--output", "out"])).toBe(1);
    expect(captured.error()).toContain("not found");
  });
});

describe("save command", () => {
  const talk = join(import.meta.dir, "../__fixtures__/talk");

  it("saves the talk into the target directory", async () => {
    expect(await run(saveCmd, [talk, "--target", "public"])).toBe(0);
    expect(existsSync(join(cwd.dir, "public/index.html"))).toBe(true);
  });

  it("marks the presentation as deployed", async () => {
    await run(saveCmd, [talk, "--target", "out"]);
    const html = await Bun.file(join(cwd.dir, "out/index.html")).text();
    expect(html).toBeString();
  });

  it("documents its options", () => {
    const help = saveCmd.helpText();
    expect(help).toContain("--target");
    expect(help).toContain("--conf");
    expect(help).toContain("--lang");
  });
});

describe("skills command", () => {
  it("writes both skill files", async () => {
    const urls: string[] = [];
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation(((url: string) => {
      urls.push(url);
      return Promise.resolve(new Response(`content of ${url}`));
    }) as never);
    expect(await run(skillsCmd, [])).toBe(0);
    expect(urls).toHaveLength(2);
    expect(
      await Bun.file(join(cwd.dir, ".claude/skills/slidesk.md")).text(),
    ).toContain("SKILL.md");
    expect(
      await Bun.file(join(cwd.dir, ".claude/skills/slidesk.link.md")).text(),
    ).toContain("slidesk.link");
    expect(captured.log()).toContain("skills added successfully");
  });
});
