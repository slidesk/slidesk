import { describe, expect, it } from "bun:test";
import unzip from "../../utils/unzip";
import type { Page } from "../browser";
import pptx from "./pptx";

const fakePage = (notes: string[]) => {
  const evaluated: string[] = [];
  let shot = 0;
  const page = {
    evaluate: async (expression: string) => {
      evaluated.push(expression);
      return expression.includes("aside.sd-notes") ? notes : undefined;
    },
    screenshot: async () => new Uint8Array([137, 80, 78, 71, shot++]),
  } as unknown as Page;
  return { page, evaluated };
};

const entries = async (data: Uint8Array) =>
  Object.keys(await unzip(Buffer.from(data)));

const decode = (part: Uint8Array) => new TextDecoder().decode(part);

describe("pptx", () => {
  it("packs one slide, one relationship file and one image per slide", async () => {
    const { page } = fakePage(["", "", ""]);
    const names = await entries(
      await pptx(page, 3, 1920, 1080, "My talk", 0, () => {}),
    );
    for (const num of [1, 2, 3]) {
      expect(names).toContain(`ppt/slides/slide${num}.xml`);
      expect(names).toContain(`ppt/slides/_rels/slide${num}.xml.rels`);
      expect(names).toContain(`ppt/media/image${num}.png`);
    }
  });

  it("packs the presentation skeleton", async () => {
    const { page } = fakePage([""]);
    const names = await entries(
      await pptx(page, 1, 1920, 1080, "My talk", 0, () => {}),
    );
    expect(names).toContain("[Content_Types].xml");
    expect(names).toContain("_rels/.rels");
    expect(names).toContain("docProps/core.xml");
    expect(names).toContain("docProps/app.xml");
    expect(names).toContain("ppt/presentation.xml");
    expect(names).toContain("ppt/slideMasters/slideMaster1.xml");
    expect(names).toContain("ppt/slideLayouts/slideLayout1.xml");
    expect(names).toContain("ppt/theme/theme1.xml");
  });

  it("omits the notes parts when no slide has notes", async () => {
    const { page } = fakePage(["", ""]);
    const names = await entries(
      await pptx(page, 2, 1920, 1080, "My talk", 0, () => {}),
    );
    expect(names.some((n) => n.startsWith("ppt/notesSlides/"))).toBe(false);
    expect(names).not.toContain("ppt/notesMasters/notesMaster1.xml");
  });

  it("packs a notes slide only for the slides that have notes", async () => {
    const { page } = fakePage(["", "second note", ""]);
    const names = await entries(
      await pptx(page, 3, 1920, 1080, "My talk", 0, () => {}),
    );
    expect(names).toContain("ppt/notesMasters/notesMaster1.xml");
    expect(names).toContain("ppt/notesSlides/notesSlide2.xml");
    expect(names).toContain("ppt/notesSlides/_rels/notesSlide2.xml.rels");
    expect(names).not.toContain("ppt/notesSlides/notesSlide1.xml");
    expect(names).not.toContain("ppt/notesSlides/notesSlide3.xml");
  });

  it("carries the note text into the notes slide", async () => {
    const { page } = fakePage(["a spoken note"]);
    const archive = await unzip(
      Buffer.from(await pptx(page, 1, 1920, 1080, "My talk", 0, () => {})),
    );
    expect(decode(archive["ppt/notesSlides/notesSlide1.xml"])).toContain(
      "a spoken note",
    );
  });

  it("writes the title into the document properties", async () => {
    const { page } = fakePage([""]);
    const archive = await unzip(
      Buffer.from(await pptx(page, 1, 1920, 1080, "My talk", 0, () => {})),
    );
    expect(decode(archive["docProps/core.xml"])).toContain("My talk");
  });

  it("reports progress for every slide", async () => {
    const { page } = fakePage(["", "", ""]);
    const seen: number[] = [];
    await pptx(page, 3, 1920, 1080, "My talk", 0, (num) => seen.push(num));
    expect(seen).toEqual([1, 2, 3]);
  });

  it("stores each screenshot as its own image part", async () => {
    const { page } = fakePage(["", ""]);
    const archive = await unzip(
      Buffer.from(await pptx(page, 2, 1920, 1080, "My talk", 0, () => {})),
    );
    expect([...archive["ppt/media/image1.png"]]).toEqual([137, 80, 78, 71, 0]);
    expect([...archive["ppt/media/image2.png"]]).toEqual([137, 80, 78, 71, 1]);
  });
});
