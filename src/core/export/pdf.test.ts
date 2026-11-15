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
