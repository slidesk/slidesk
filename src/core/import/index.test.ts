import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
} from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { captured } from "../../__testing__/console";
import zip from "../../utils/zip";

const { default: importTalk } = await import("./index");

const scratch = join(import.meta.dir, "../../__fixtures__/.tmp-import");
let fetchSpy: ReturnType<typeof spyOn> | undefined;

const stubFetch = (responder: (url: string) => Response) => {
  const urls: string[] = [];
  fetchSpy = spyOn(globalThis, "fetch").mockImplementation(((url: string) => {
    urls.push(url);
    return Promise.resolve(responder(url));
  }) as never);
  return urls;
};

const SLIDEV = `---
title: Slidev deck
---

# First

some text

---

# Second
`;

const REVEALJS = `<html><body><div class="reveal"><div class="slides">
<section><h2>Reveal one</h2><p>text</p></section>
<section><h2>Reveal two</h2></section>
</div></div></body></html>`;

const minimalPptx = () =>
  zip([
    {
      name: "docProps/core.xml",
      data: "<cp:coreProperties><dc:title>Packed deck</dc:title></cp:coreProperties>",
    },
    {
      name: "ppt/presentation.xml",
      data: '<p:presentation><p:sldId id="256" r:id="rId1"/></p:presentation>',
    },
    {
      name: "ppt/_rels/presentation.xml.rels",
      data: '<Relationships><Relationship Id="rId1" Target="slides/slide1.xml"/></Relationships>',
    },
    {
      name: "ppt/slides/slide1.xml",
      data: '<p:sld><p:cSld><p:spTree><p:sp><p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>Packed slide</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>',
    },
    { name: "ppt/slides/_rels/slide1.xml.rels", data: "<Relationships/>" },
  ]);

beforeEach(() => {
  captured.clear();
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(scratch, { recursive: true });
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
});

afterAll(() => {
  rmSync(scratch, { recursive: true, force: true });
});

describe("importTalk", () => {
  it("rejects an unknown import type", () => {
    expect(importTalk("deck.md", { type: "keynote" })).rejects.toThrow(
      "keynote is not a valid import type",
    );
  });

  it("rejects a source that does not exist", () => {
    expect(importTalk(join(scratch, "missing.md"), {})).rejects.toThrow(
      "not found",
    );
  });

  it("imports a slidev deck into a talk directory", async () => {
    const source = join(scratch, "slides.md");
    writeFileSync(source, SLIDEV);
    const output = join(scratch, "out");
    await importTalk(source, { output });
    expect(existsSync(join(output, "main.md"))).toBe(true);
    const main = await Bun.file(join(output, "main.md")).text();
    expect(main).toContain("!include(slides)");
    expect(captured.log()).toContain("importing as slidev");
    expect(captured.log()).toContain("2 slides");
  });

  it("imports a reveal.js deck", async () => {
    const source = join(scratch, "deck.html");
    writeFileSync(source, REVEALJS);
    const output = join(scratch, "reveal");
    await importTalk(source, { output });
    expect(captured.log()).toContain("importing as revealjs");
    expect(existsSync(join(output, "main.md"))).toBe(true);
  });

  it("imports a pptx file", async () => {
    const source = join(scratch, "deck.pptx");
    await Bun.write(source, minimalPptx());
    const output = join(scratch, "packed");
    await importTalk(source, { output });
    expect(captured.log()).toContain("importing as pptx");
    expect(existsSync(join(output, "main.md"))).toBe(true);
  });

  it("resolves a directory to its entry file", async () => {
    const dir = join(scratch, "project");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "slides.md"), SLIDEV);
    const output = join(scratch, "fromdir");
    await importTalk(dir, { output });
    expect(existsSync(join(output, "main.md"))).toBe(true);
  });

  it("downloads a remote deck", async () => {
    const urls = stubFetch(() => new Response(REVEALJS));
    const output = join(scratch, "remote");
    await importTalk("https://talks.test/deck.html", { output });
    expect(urls).toEqual(["https://talks.test/deck.html"]);
    expect(existsSync(join(output, "main.md"))).toBe(true);
  });

  it("rejects a remote deck that cannot be downloaded", () => {
    stubFetch(() => new Response("", { status: 404 }));
    expect(
      importTalk("https://talks.test/gone.html", { output: scratch }),
    ).rejects.toThrow("unable to download");
  });

  it("imports a google slides presentation through its pptx export", async () => {
    const urls = stubFetch(
      () =>
        new Response(minimalPptx(), {
          headers: { "content-type": "application/vnd.openxmlformats" },
        }),
    );
    const output = join(scratch, "gslides");
    await importTalk("https://docs.google.com/presentation/d/deck9/edit", {
      output,
    });
    expect(captured.log()).toContain("importing as gslides");
    expect(urls).toEqual([
      "https://docs.google.com/presentation/d/deck9/export/pptx",
    ]);
    expect(existsSync(join(output, "main.md"))).toBe(true);
  });

  it("rejects a presentation without slides", async () => {
    const source = join(scratch, "empty.pptx");
    await Bun.write(
      source,
      zip([
        {
          name: "ppt/presentation.xml",
          data: "<p:presentation><p:sldIdLst/></p:presentation>",
        },
        { name: "ppt/_rels/presentation.xml.rels", data: "<Relationships/>" },
      ]),
    );
    expect(
      importTalk(source, { output: join(scratch, "empty") }),
    ).rejects.toThrow("no slide found in this presentation");
  });

  it("names the output directory after the deck title", async () => {
    const previous = process.cwd();
    const source = join(scratch, "slides.md");
    writeFileSync(source, SLIDEV);
    process.chdir(scratch);
    try {
      await importTalk(source, {});
      expect(existsSync(join(scratch, "slidev-deck"))).toBe(true);
    } finally {
      process.chdir(previous);
    }
  });

  it("refuses to overwrite a directory that is not empty", async () => {
    const source = join(scratch, "slides.md");
    writeFileSync(source, SLIDEV);
    const output = join(scratch, "taken");
    mkdirSync(output, { recursive: true });
    writeFileSync(join(output, "keep.txt"), "mine");
    expect(importTalk(source, { output })).rejects.toThrow(
      "already exists and is not empty",
    );
  });

  it("overwrites a non empty directory when forced", async () => {
    const source = join(scratch, "slides.md");
    writeFileSync(source, SLIDEV);
    const output = join(scratch, "forced");
    mkdirSync(output, { recursive: true });
    writeFileSync(join(output, "keep.txt"), "mine");
    await importTalk(source, { output, force: true });
    expect(existsSync(join(output, "main.md"))).toBe(true);
  });

  it("honours an explicit import type", async () => {
    const source = join(scratch, "ambiguous.txt");
    writeFileSync(source, SLIDEV);
    const output = join(scratch, "typed");
    await importTalk(source, { output, type: "slidev" });
    expect(captured.log()).toContain("importing as slidev");
  });

  it("reports the assets and the notes it imported", async () => {
    const source = join(scratch, "slides.md");
    writeFileSync(source, SLIDEV);
    await importTalk(source, { output: join(scratch, "counted") });
    expect(captured.log()).toMatch(/\d+ slides, \d+ assets, \d+ with notes/);
    expect(captured.log()).toContain("&& slidesk");
  });
});
