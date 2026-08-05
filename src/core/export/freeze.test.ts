import { describe, expect, it } from "bun:test";
import type { Page } from "../browser";
import { freeze, thaw } from "./freeze";

const fakePage = (calls: string[]) =>
  ({
    evaluate: async (expression: string) => {
      calls.push(expression);
      return undefined as never;
    },
  }) as unknown as Page;

describe("freeze function", () => {
  it("should snapshot the asked slide", async () => {
    const calls: string[] = [];
    await freeze(fakePage(calls), 2);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('document.querySelectorAll(".sd-slide")[2]');
  });

  it("should store the snapshot under its own index", async () => {
    const calls: string[] = [];
    await freeze(fakePage(calls), 5);
    expect(calls[0]).toContain("window.__slideskFrozen[5] = clone.innerHTML");
  });

  it("should turn canvases into images", async () => {
    const calls: string[] = [];
    await freeze(fakePage(calls), 0);
    expect(calls[0]).toContain("toDataURL()");
    expect(calls[0]).toContain("canvas.replaceWith(img)");
  });
});

describe("thaw function", () => {
  it("should put the snapshots back", async () => {
    const calls: string[] = [];
    await thaw(fakePage(calls));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("slide.innerHTML = html");
  });

  it("should leave untouched slides and iframes alone", async () => {
    const calls: string[] = [];
    await thaw(fakePage(calls));
    expect(calls[0]).toContain("slide.innerHTML === html");
    expect(calls[0]).toContain('slide.querySelector("iframe")');
  });

  it("should wait for the restored images", async () => {
    const calls: string[] = [];
    await thaw(fakePage(calls));
    expect(calls[0]).toContain("document.images");
    expect(calls[0]).toContain("document.fonts.ready");
  });
});
