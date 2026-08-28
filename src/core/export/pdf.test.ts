import { describe, expect, it } from "bun:test";
import type { Page } from "../browser";
import pdf from "./pdf";

const fakePage = () => {
  const evaluated: string[] = [];
  let printParams: Record<string, unknown> = {};
  const page = {
    evaluate: async (expression: string) => {
      evaluated.push(expression);
      return undefined;
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
    expect(evaluated.filter((e) => e.includes("slidesk.goto"))).toHaveLength(3);
    expect(evaluated.filter((e) => e.includes("__slideskFrozen"))).toHaveLength(
      4, // one snapshot per slide plus the final restore
    );
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
