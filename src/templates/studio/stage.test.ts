import { describe, expect, it } from "bun:test";
import {
  images,
  insertUnit,
  notesOf,
  placeImage,
  plain,
  setUnit,
  sizeImage,
  toMarkdown,
  units,
  withNotes,
} from "./stage.js";

const SLIDE = `## Title .[big]

A **bold**
paragraph

- one
- [two](https://x.y)

\`\`\`js
- not an item
\`\`\`

!image(a.png)

/*
- not an item either
*/
### Sub`;

describe("studio stage", () => {
  it("finds the texts of a slide and the lines they span", () => {
    expect(units(SLIDE).map((u) => [u.from, u.to, plain(u.body)])).toEqual([
      [0, 0, "Title"],
      [2, 3, "A bold paragraph"],
      [5, 5, "one"],
      [6, 6, "two"],
      [17, 17, "Sub"],
    ]);
  });

  it("replaces a text, keeping its markup", () => {
    const [title, paragraph, item] = units(SLIDE);
    expect(setUnit(SLIDE, title, "New").split("\n")[0]).toBe("## New .[big]");
    expect(setUnit(SLIDE, paragraph, "Short").split("\n")[2]).toBe("Short");
    expect(setUnit(SLIDE, item, "uno").split("\n")[5]).toBe("- uno");
    // an emptied item goes away
    expect(setUnit(SLIDE, item, " ")).not.toContain("- one");
  });

  it("adds an item to a list, a paragraph after another", () => {
    const [, paragraph, item] = units(SLIDE);
    expect(insertUnit(SLIDE, item, "one bis").split("\n").slice(5, 8)).toEqual([
      "- one",
      "- one bis",
      "- [two](https://x.y)",
    ]);
    expect(
      insertUnit(SLIDE, paragraph, "Next").split("\n").slice(2, 6),
    ).toEqual(["A **bold**", "paragraph", "", "Next"]);
  });

  it("places an image where it is dropped", () => {
    const slide =
      "## A\n\n```\n!image(no.png)\n```\n\n!image(a.png, A, 10,, color: red; top: 1px)\n!image(b.png,,,,[c])";
    expect(images(slide)).toEqual(["a.png", "b.png"]);
    expect(placeImage(slide, 0, 12.5, 40).split("\n")[6]).toBe(
      "!image(a.png, A, 10,,color: red; position: absolute; left: 12.5%; top: 40%; margin: 0)",
    );
    expect(placeImage("!image(x.png)", 0, 1, 2)).toBe(
      "!image(x.png,,,,position: absolute; left: 1%; top: 2%; margin: 0)",
    );
    // a class takes the place of the style
    expect(placeImage(slide, 1, 1, 2)).toBe(slide);
    expect(sizeImage(slide, 0, 300).split("\n")[6]).toBe(
      "!image(a.png, A,300,, color: red; top: 1px)",
    );
    expect(sizeImage(slide, 1, 50).split("\n")[7]).toBe(
      "!image(b.png,,50,,[c])",
    );
  });

  it("reads, replaces and removes the speaker notes", () => {
    expect(notesOf(SLIDE)).toBe("- not an item either");
    expect(withNotes(SLIDE, "hello")).toContain("/*\nhello\n*/");
    expect(withNotes("## A\n", "hi")).toBe("## A\n\n/*\nhi\n*/\n");
    expect(withNotes(SLIDE, "")).not.toContain("/*");
  });

  it("writes what was typed as markdown", () => {
    const text = (t: string) => ({ nodeType: 3, textContent: t });
    const el = (nodeName: string, ...childNodes: object[]) => ({
      nodeType: 1,
      nodeName,
      childNodes,
      textContent: "code",
      getAttribute: () => "https://x.y",
    });
    expect(
      toMarkdown(
        el(
          "P",
          text("a "),
          el("STRONG", text("b")),
          text(" "),
          el("EM", text("c")),
          text(" "),
          el("A", text("d")),
          text(" "),
          el("CODE"),
        ) as unknown as Node,
      ),
    ).toBe("a **b** _c_ [d](https://x.y) `code`");
  });
});
