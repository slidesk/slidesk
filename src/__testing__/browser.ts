import type { Page } from "../core/browser";
import * as actual from "../core/browser";

/**
 * Launching a real Chromium is out of reach in the test suite, so every test
 * file that needs one registers the same `mock.module("…/core/browser")`
 * pointing at `fakeLaunch`. Bun keeps a module mock for the whole process and
 * the last registration wins, so the page itself is read from this holder at
 * call time — whichever registration is live, each file drives its own page.
 */
export const browserStub: { page: Page | null; launched: number[][] } = {
  page: null,
  launched: [],
};

/**
 * Replaces only the default export: the module's named exports stay reachable
 * for the tests that assert on them.
 */
export const browserModuleMock = () => ({ ...actual, default: fakeLaunch });

export const fakeLaunch = async (width: number, height: number) => {
  browserStub.launched.push([width, height]);
  if (browserStub.page === null)
    throw new Error("no fake page was set for this test");
  return browserStub.page;
};

/** A page that answers the calls prepare/pdf/pptx make, with `slides` slides. */
export const fakePage = (slides = 3) => {
  let closed = false;
  const page = {
    goto: async () => {},
    evaluate: async (expression: string) => {
      if (expression.includes("aside.sd-notes"))
        return Array.from({ length: slides }, () => "");
      if (
        expression.includes("sd-slide") &&
        expression.includes("document.images")
      )
        return slides;
      return undefined;
    },
    printToPDF: async () => new Uint8Array([37, 80, 68, 70]),
    screenshot: async () => new Uint8Array([137, 80, 78, 71]),
    close: async () => {
      closed = true;
    },
  } as unknown as Page;
  return { page, isClosed: () => closed };
};
