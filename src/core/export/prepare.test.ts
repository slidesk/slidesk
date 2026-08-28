import { describe, expect, it } from "bun:test";
import type { Page } from "../browser";
import prepare from "./prepare";

const fakePage = (total: unknown) => {
  const evaluated: string[] = [];
  const page = {
    evaluate: async (expression: string) => {
      evaluated.push(expression);
      return expression.includes("sd-slide") &&
        expression.includes("document.images")
        ? total
        : undefined;
    },
  } as unknown as Page;
  return { page, evaluated };
};

describe("prepare", () => {
  it("returns the number of slides found in the page", async () => {
    const { page } = fakePage(7);
    expect(await prepare(page, 1920, 1080)).toBe(7);
  });

  it("injects a print stylesheet sized after the viewport", async () => {
    const { page, evaluated } = fakePage(1);
    await prepare(page, 1280, 720);
    expect(evaluated[0]).toContain("size: 1280px 720px");
    expect(evaluated[0]).toContain("width: 1280px !important");
    expect(evaluated[0]).toContain("height: 720px !important");
    expect(evaluated[0]).toContain("break-after: page");
  });

  it("waits for images and fonts before counting", async () => {
    const { page, evaluated } = fakePage(2);
    await prepare(page, 800, 600);
    expect(evaluated[1]).toContain("document.images");
    expect(evaluated[1]).toContain("document.fonts.ready");
    expect(evaluated[1]).toContain("data-src");
  });

  it("rejects a presentation without slides", async () => {
    const { page } = fakePage(0);
    expect(prepare(page, 800, 600)).rejects.toThrow(
      "no slide found in this presentation",
    );
  });
});
