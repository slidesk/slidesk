import { describe, expect, it } from "bun:test";
import { fakeDeck } from "../../__testing__/deck";
import type { Page } from "../browser";
import pdf from "./pdf";

const fakePage = (steps: number[] = [0, 0, 0]) => {
  const deck = fakeDeck(steps);
  const evaluated: string[] = [];
  let printParams: Record<string, unknown> = {};
  const page = {
    evaluate: async (expression: string) => {
      evaluated.push(expression);
      return deck(expression);
    },
    printToPDF: async (params: Record<string, unknown>) => {
      printParams = params;
      return new Uint8Array([37, 80, 68, 70]);
    },
  } as unknown as Page;
  return { page, evaluated, printed: () => printParams };
};

// what webkit gives: no printToPDF, captures only
const webkitPage = (steps: number[], notes: string[] = []) => {
  const deck = fakeDeck(steps);
  const formats: (string | undefined)[] = [];
  let shot = 0;
  const page = {
    evaluate: async (expression: string) =>
      expression.includes("aside.sd-notes") ? notes : deck(expression),
    screenshot: async (format?: string) => {
      formats.push(format);
      shot += 1;
      return new Uint8Array([
        0xff,
        0xd8,
        0xff,
        0xc0,
        0x00,
        0x11,
        0x08,
        0,
        9,
        0,
        shot,
        3,
      ]);
    },
  } as unknown as Page;
  return { page, formats };
};

describe("pdf without printing (webkit)", () => {
  it("makes a page of each capture, in jpeg", async () => {
    const { page, formats } = webkitPage([0, 2]);
    const data = Buffer.from(
      await pdf(page, 2, 1920, 1080, 0, () => {}),
    ).toString("latin1");
    expect(data.startsWith("%PDF")).toBe(true);
    expect(data).toContain("/Count 4");
    expect(formats.every((f) => f === "jpeg")).toBe(true);
  });

  it("adds the notes of a slide after its last step", async () => {
    const { page } = webkitPage([1, 0], ["<p>hello</p>", ""]);
    const data = Buffer.from(
      await pdf(page, 2, 1920, 1080, 0, () => {}, true),
    ).toString("latin1");
    // the captures are numbered in order: the notes are taken after the
    // walk (4th), and placed after the last step of slide 1, before slide 2
    const widths = [...data.matchAll(/\/Width (\d+)/g)].map((m) => m[1]);
    expect(widths).toEqual(["1", "2", "4", "3"]);
    expect(data).toContain("/Count 4");
  });
});

describe("pdf", () => {
  it("returns the rendered document", async () => {
    const { page } = fakePage();
    const data = await pdf(page, 1, 1920, 1080, 0, () => {});
    expect([...data]).toEqual([37, 80, 68, 70]);
  });

  it("walks every slide, snapshotting each one", async () => {
    const { page, evaluated } = fakePage();
    const seen: number[] = [];
    await pdf(page, 3, 1920, 1080, 0, (num) => seen.push(num));
    expect(seen).toEqual([1, 2, 3]);
    expect(evaluated.filter((e) => e.includes("__slideskFrozen"))).toHaveLength(
      4, // one snapshot per slide plus the final restore
    );
  });

  it("snapshots each revealed step under its slide", async () => {
    const { page, evaluated } = fakePage([0, 2]);
    const seen: number[] = [];
    await pdf(page, 2, 1920, 1080, 0, (num) => seen.push(num));
    expect(seen).toEqual([1, 2, 2, 2]);
    const frozen = evaluated.filter((e) => e.includes("__slideskFrozen[1]["));
    expect(
      frozen.map((e) => /__slideskFrozen\[1\]\[(\d+)\] =/.exec(e)?.[1]),
    ).toEqual(["0", "1", "2"]);
  });

  it("adds the notes pages only when asked", async () => {
    const without = fakePage([0]);
    await pdf(without.page, 1, 1920, 1080, 0, () => {});
    expect(without.evaluated.some((e) => e.includes("sd-export-notes"))).toBe(
      false,
    );
    const asked = fakePage([0]);
    await pdf(asked.page, 1, 1920, 1080, 0, () => {}, true);
    expect(asked.evaluated.at(-1)).toContain("sd-export-notes");
  });

  it("prints one bookmark per heading", async () => {
    const { page, printed } = fakePage([0]);
    await pdf(page, 1, 1920, 1080, 0, () => {});
    expect(printed().generateDocumentOutline).toBe(true);
  });

  it("converts the viewport to inches for the page size", async () => {
    const { page, printed } = fakePage();
    await pdf(page, 1, 1920, 1080, 0, () => {});
    expect(printed().paperWidth).toBe(20);
    expect(printed().paperHeight).toBe(11.25);
    expect(printed().printBackground).toBe(true);
    expect(printed().preferCSSPageSize).toBe(true);
    expect(printed().transferMode).toBe("ReturnAsBase64");
  });
});
