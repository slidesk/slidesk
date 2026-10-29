import { afterEach, describe, expect, it } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { edit, outline } from "./slides";

let dir = "";

afterEach(() => rmSync(dir, { recursive: true, force: true }));

const talk = () => {
  dir = mkdtempSync(join(tmpdir(), "slidesk-studio-"));
  mkdirSync(join(dir, "slides"));
  writeFileSync(join(dir, "main.md"), "## TITLE .[big]\n\n!include(slides)\n");
  writeFileSync(join(dir, "slides/01.md"), "## A\n\ntext\n\n## B\n");
  writeFileSync(
    join(dir, "slides/02.md"),
    "## C\n\n```md\n## not a slide\n```\n",
  );
  writeFileSync(join(dir, "README.md"), "## Not in the talk\n");
  return dir;
};

const titles = async () =>
  (await outline(dir, join(dir, "main.md"))).map(
    (s) => `${s.index}:${s.title}`,
  );

describe("studio slides", () => {
  it("places each slide of the files where the presentation shows it", async () => {
    talk();
    expect(await titles()).toEqual(["0:TITLE", "1:A", "2:B", "3:C"]);
  });

  it("counts what precedes the first title as part of the first slide", async () => {
    talk();
    writeFileSync(
      join(dir, "main.md"),
      "/::\n::/\n# Big\n\n!include(slides)\n",
    );
    expect(await titles()).toEqual(["0:Big", "1:A", "2:B", "3:C"]);
  });

  it("saves, adds, removes and moves slides", async () => {
    talk();
    const read = (f: string) => readFileSync(join(dir, f), "utf8");
    await edit(dir, {
      action: "save",
      file: "slides/01.md",
      n: 2,
      text: "## B2\n",
    });
    expect(read("slides/01.md")).toBe("## A\n\ntext\n\n## B2\n");
    await edit(dir, { action: "add", file: "slides/01.md", n: 1 });
    expect(read("slides/01.md")).toBe(
      "## A\n\ntext\n\n## New slide\n\n## B2\n",
    );
    await edit(dir, { action: "remove", file: "slides/01.md", n: 2 });
    expect(read("slides/01.md")).toBe("## A\n\ntext\n\n## B2\n");
    await edit(dir, {
      action: "move",
      file: "slides/02.md",
      n: 1,
      to: "slides/01.md",
      at: 1,
    });
    expect(await titles()).toEqual(["0:TITLE", "1:C", "2:A", "3:B2"]);
    await edit(dir, {
      action: "move",
      file: "slides/01.md",
      n: 1,
      to: "slides/01.md",
      at: 3,
      after: true,
    });
    expect(await titles()).toEqual(["0:TITLE", "1:A", "2:B2", "3:C"]);
  });
});
