import { describe, expect, it } from "bun:test";
import zip, { type ZipEntry } from "../../utils/zip";
import pptx from "./pptx";

type SlideSpec = {
  tree: string;
  rels?: string[];
  notes?: string;
  media?: Record<string, Uint8Array>;
};

/** Assembles the minimum pptx parts the importer reads. */
const buildPptx = (slides: SlideSpec[], title = "A deck") => {
  const entries: ZipEntry[] = [
    {
      name: "docProps/core.xml",
      data: `<cp:coreProperties><dc:title>${title}</dc:title></cp:coreProperties>`,
    },
    {
      name: "ppt/presentation.xml",
      data: `<p:presentation><p:sldIdLst>${slides
        .map((_, i) => `<p:sldId id="${256 + i}" r:id="rIdS${i + 1}"/>`)
        .join("")}</p:sldIdLst></p:presentation>`,
    },
    {
      name: "ppt/_rels/presentation.xml.rels",
      data: `<Relationships>${slides
        .map(
          (_, i) =>
            `<Relationship Id="rIdS${i + 1}" Target="slides/slide${i + 1}.xml"/>`,
        )
        .join("")}</Relationships>`,
    },
  ];

  slides.forEach((spec, i) => {
    const num = i + 1;
    entries.push({
      name: `ppt/slides/slide${num}.xml`,
      data: `<p:sld><p:cSld><p:spTree>${spec.tree}</p:spTree></p:cSld></p:sld>`,
    });
    const rels = [...(spec.rels ?? [])];
    if (spec.notes !== undefined) {
      rels.push(
        `<Relationship Id="rIdN" Target="../notesSlides/notesSlide${num}.xml"/>`,
      );
      entries.push({
        name: `ppt/notesSlides/notesSlide${num}.xml`,
        data: `<p:notes><p:cSld><p:spTree><p:sp><p:nvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:txBody>${spec.notes}</p:txBody></p:sp></p:spTree></p:cSld></p:notes>`,
      });
      entries.push({
        name: `ppt/notesSlides/_rels/notesSlide${num}.xml.rels`,
        data: "<Relationships/>",
      });
    }
    entries.push({
      name: `ppt/slides/_rels/slide${num}.xml.rels`,
      data: `<Relationships>${rels.join("")}</Relationships>`,
    });
    for (const [name, data] of Object.entries(spec.media ?? {}))
      entries.push({ name: `ppt/media/${name}`, data, store: true });
  });

  return zip(entries);
};

const para = (text: string, props = "") =>
  `<a:p>${props}<a:r><a:t>${text}</a:t></a:r></a:p>`;

const shape = (phType: string | null, body: string) =>
  `<p:sp><p:nvSpPr><p:nvPr>${
    phType ? `<p:ph type="${phType}"/>` : ""
  }</p:nvPr></p:nvSpPr><p:txBody>${body}</p:txBody></p:sp>`;

describe("pptx importer", () => {
  it("rejects an archive that is not a presentation", () => {
    const data = zip([{ name: "hello.txt", data: "hi" }]);
    expect(() => pptx(data)).toThrow("does not look like a pptx presentation");
  });

  it("reads the deck title from the document properties", () => {
    const deck = pptx(
      buildPptx([{ tree: shape("title", para("Slide one")) }], "My deck"),
    );
    expect(deck.title).toBe("My deck");
  });

  it("falls back to the first slide title", () => {
    const deck = pptx(
      buildPptx([{ tree: shape("title", para("Opening")) }], ""),
    );
    expect(deck.title).toBe("Opening");
  });

  it("falls back to a generic title", () => {
    const deck = pptx(
      buildPptx([{ tree: shape(null, para("body only")) }], ""),
    );
    expect(deck.title).toBe("Imported presentation");
  });

  it("reads one slide per presentation entry, in order", () => {
    const deck = pptx(
      buildPptx([
        { tree: shape("title", para("First")) },
        { tree: shape("title", para("Second")) },
      ]),
    );
    expect(deck.slides.map((s) => s.title)).toEqual(["First", "Second"]);
  });

  it("takes the title from a title placeholder and keeps it out of the body", () => {
    const deck = pptx(
      buildPptx([
        {
          tree:
            shape("ctrTitle", para("The title")) +
            shape(null, para("Some text")),
        },
      ]),
    );
    expect(deck.slides[0].title).toBe("The title");
    expect(deck.slides[0].content).toBe("Some text");
  });

  it("turns a body placeholder into a bullet list", () => {
    const deck = pptx(
      buildPptx([{ tree: shape("body", para("one") + para("two")) }]),
    );
    expect(deck.slides[0].content).toBe("- one\n- two");
  });

  it("indents nested bullets", () => {
    const deck = pptx(
      buildPptx([
        {
          tree: shape("body", para("top") + para("child", '<a:pPr lvl="1"/>')),
        },
      ]),
    );
    expect(deck.slides[0].content).toBe("- top\n  - child");
  });

  it("keeps a paragraph marked buNone out of the list", () => {
    const deck = pptx(
      buildPptx([
        {
          tree: shape(
            "body",
            para("plain", "<a:pPr><a:buNone/></a:pPr>") + para("listed"),
          ),
        },
      ]),
    );
    expect(deck.slides[0].content).toBe("plain\n- listed");
  });

  it("renders bold and italic runs", () => {
    const tree = shape(
      null,
      '<a:p><a:r><a:rPr b="1"/><a:t>strong</a:t></a:r><a:r><a:rPr i="1"/><a:t>slanted</a:t></a:r></a:p>',
    );
    const deck = pptx(buildPptx([{ tree }]));
    expect(deck.slides[0].content).toBe("**strong***slanted*");
  });

  it("turns a line break into a space", () => {
    const tree = shape(
      null,
      "<a:p><a:r><a:t>before</a:t></a:r><a:br/><a:r><a:t>after</a:t></a:r></a:p>",
    );
    expect(pptx(buildPptx([{ tree }])).slides[0].content).toBe("before after");
  });

  it("resolves a hyperlink through the slide relationships", () => {
    const tree = shape(
      null,
      '<a:p><a:r><a:rPr/><a:hlinkClick r:id="rIdL"/><a:t>site</a:t></a:r></a:p>',
    );
    const deck = pptx(
      buildPptx([
        {
          tree,
          rels: [
            '<Relationship Id="rIdL" Target="https://slidesk.dev" TargetMode="External"/>',
          ],
        },
      ]),
    );
    expect(deck.slides[0].content).toBe("[site](https://slidesk.dev)");
  });

  it("renders a table as markdown", () => {
    const cell = (text: string) => `<a:tc>${para(text)}</a:tc>`;
    const tree = `<p:graphicFrame><a:tbl><a:tr>${cell("h1")}${cell(
      "h2",
    )}</a:tr><a:tr>${cell("a")}${cell("b")}</a:tr></a:tbl></p:graphicFrame>`;
    expect(pptx(buildPptx([{ tree }])).slides[0].content).toBe(
      "| h1 | h2 |\n| --- | --- |\n| a | b |",
    );
  });

  it("escapes a pipe inside a table cell", () => {
    const tree = `<p:graphicFrame><a:tbl><a:tr><a:tc>${para(
      "a|b",
    )}</a:tc></a:tr></a:tbl></p:graphicFrame>`;
    expect(pptx(buildPptx([{ tree }])).slides[0].content).toContain("a\\|b");
  });

  it("extracts a picture as an asset and references it", () => {
    const tree =
      '<p:pic><p:nvPicPr><p:cNvPr id="2" name="Picture 2" descr="A (nice), photo"/></p:nvPicPr><p:blipFill><a:blip r:embed="rIdI"/></p:blipFill></p:pic>';
    const deck = pptx(
      buildPptx([
        {
          tree,
          rels: ['<Relationship Id="rIdI" Target="../media/shot.png"/>'],
          media: { "shot.png": new Uint8Array([137, 80, 78, 71]) },
        },
      ]),
    );
    expect(Object.keys(deck.assets)).toEqual(["shot.png"]);
    expect([...deck.assets["shot.png"]]).toEqual([137, 80, 78, 71]);
    expect(deck.slides[0].content).toBe(
      "!image(assets/shot.png, A nice photo)",
    );
  });

  it("ignores a picture whose media part is missing", () => {
    const tree =
      '<p:pic><p:nvPicPr><p:cNvPr id="2" name="Gone"/></p:nvPicPr><p:blipFill><a:blip r:embed="rIdI"/></p:blipFill></p:pic>';
    const deck = pptx(
      buildPptx([
        {
          tree,
          rels: ['<Relationship Id="rIdI" Target="../media/gone.png"/>'],
        },
      ]),
    );
    expect(deck.assets).toEqual({});
    expect(deck.slides[0].content).toBe("");
  });

  it("reads the speaker notes of a slide", () => {
    const deck = pptx(
      buildPptx([
        {
          tree: shape("title", para("With notes")),
          notes: para("say this") + para("and that"),
        },
      ]),
    );
    expect(deck.slides[0].notes).toBe("say this\nand that");
  });

  it("leaves the notes empty when there are none", () => {
    const deck = pptx(buildPptx([{ tree: shape("title", para("Bare")) }]));
    expect(deck.slides[0].notes).toBe("");
  });

  it("unescapes xml entities in the text", () => {
    const deck = pptx(
      buildPptx([{ tree: shape(null, para("a &amp; b &lt; c")) }]),
    );
    expect(deck.slides[0].content).toBe("a & b < c");
  });

  it("resolves a relationship target given from the package root", () => {
    const tree =
      '<p:pic><p:nvPicPr><p:cNvPr id="2" name="Root"/></p:nvPicPr><p:blipFill><a:blip r:embed="rIdI"/></p:blipFill></p:pic>';
    const deck = pptx(
      buildPptx([
        {
          tree,
          rels: ['<Relationship Id="rIdI" Target="/ppt/media/root.png"/>'],
          media: { "root.png": new Uint8Array([1, 2]) },
        },
      ]),
    );
    expect(Object.keys(deck.assets)).toEqual(["root.png"]);
  });
});
