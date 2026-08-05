import { describe, expect, it } from "bun:test";
import type { ImportedSlide } from "./types";
import files, { slideFile } from "./write";

const slide = (over: Partial<ImportedSlide> = {}): ImportedSlide => ({
  title: "A title",
  content: "body",
  notes: "",
  classes: [],
  ...over,
});

describe("slideFile function", () => {
  it("should write the title as a slide heading", () => {
    expect(slideFile(slide())).toBe("## A title\n\nbody\n");
  });

  it("should append the classes to the heading", () => {
    expect(slideFile(slide({ classes: ["cover", "dark"] }))).toContain(
      "## A title .[cover dark]",
    );
  });

  it("should demote headings that would start a new slide", () => {
    const out = slideFile(slide({ content: "# one\n## two\n### three" }));
    expect(out).toContain("### one\n### two\n### three");
  });

  it("should wrap notes in a comment block", () => {
    expect(slideFile(slide({ notes: "remember this" }))).toContain(
      "/*\nremember this\n*/",
    );
  });

  it("should neutralise a note that would close the comment early", () => {
    expect(slideFile(slide({ notes: "a */ b" }))).toContain("a * / b");
  });

  it("should not let a title open a class block", () => {
    expect(slideFile(slide({ title: "Arrays .[0]" }))).toContain(
      "## Arrays . [0]",
    );
  });

  it("should handle a slide with no body", () => {
    expect(slideFile(slide({ content: "" }))).toBe("## A title\n");
  });

  it("should keep the space that cuts a slide when there is no title", () => {
    expect(slideFile(slide({ title: "", content: "body" }))).toBe(
      "## \n\nbody\n",
    );
  });

  it("should keep classes readable on an untitled slide", () => {
    expect(slideFile(slide({ title: "", classes: ["cover"] }))).toContain(
      "## .[cover]",
    );
  });
});

describe("files function", () => {
  const deck = {
    title: "Démo Import",
    slides: [slide({ title: "One" }), slide({ title: "Deux étoiles" })],
    assets: { "image1.png": new Uint8Array([1, 2]) },
  };

  it("should number and slugify the slide files", () => {
    expect(Object.keys(files(deck))).toContain("slides/01-one.md");
    expect(Object.keys(files(deck))).toContain("slides/02-deux-etoiles.md");
  });

  it("should keep main.md free of a synthetic cover slide", () => {
    expect(files(deck)["main.md"]).toBe("\n!include(slides)\n");
  });

  it("should write the deck title into the config", () => {
    expect(files(deck)["slidesk.toml"]).toBe(
      '[slidesk]\nTITLE="Démo Import"\n',
    );
  });

  it("should place assets under assets/", () => {
    expect(Object.keys(files(deck))).toContain("assets/image1.png");
  });

  it("should fall back to a generic name for untitled slides", () => {
    const out = files({ ...deck, slides: [slide({ title: "" })] });
    expect(Object.keys(out)).toContain("slides/01-slide.md");
  });

  it("should widen the numbering for large decks", () => {
    const many = Array.from({ length: 100 }, () => slide({ title: "x" }));
    expect(Object.keys(files({ ...deck, slides: many }))).toContain(
      "slides/001-x.md",
    );
  });
});
