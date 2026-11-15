import { existsSync } from "node:fs";
import { platform } from "node:os";

// bun already passes --headless --no-first-run --no-default-browser-check
// --disable-gpu --disable-extensions --disable-background-networking, so only
// what an export needs on top of that is listed here
const RENDER_FLAGS = [
  "--hide-scrollbars",
  "--mute-audio",
  "--disable-sync",
  "--disable-dev-shm-usage",
  "--force-color-profile=srgb",
  "--font-render-hinting=none",
  // ignored by other chromium builds, keeps vivaldi's renderer alive
  "--disable-vivaldi",
];

// bun looks for chrome, chromium, brave, edge and playwright's cached
// chrome-headless-shell, but not for these — they are only tried when its own
// detection came up empty
const FALLBACKS: Record<string, string[]> = {
  darwin: [
    "/Applications/Vivaldi.app/Contents/MacOS/Vivaldi",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: ["vivaldi"],
};

const fallback = () => {
  const candidates = FALLBACKS[platform()] ?? [];
  return (
    candidates
      .map((c) => {
        if (!c.startsWith("/")) return Bun.which(c);
        return existsSync(c) ? c : null;
      })
      .find((c) => c !== null && c !== undefined) ?? undefined
  );
};

const INSTALL = "bunx playwright install chromium-headless-shell";

export const NOT_FOUND_MESSAGE = `🤔 No Chromium-based browser found.
   Exporting needs one, the lightest is chrome-headless-shell:
   ${INSTALL}
   Chrome, Chromium, Edge, Brave or Vivaldi work too,
   set SLIDESK_CHROME=/path/to/browser to point at a specific one.`;

export const WEBKIT_MESSAGE = `ℹ️  No Chromium-based browser found, exporting with the WebKit of macOS:
   a pdf is made of images, without selectable text, links or bookmarks.
   For a real pdf, install chrome-headless-shell: ${INSTALL}`;

export type Page = {
  goto: (url: string) => Promise<void>;
  evaluate: <T>(expression: string) => Promise<T>;
  /** chrome only: webkit has no way to print a pdf */
  printToPDF?: (params: Record<string, unknown>) => Promise<Uint8Array>;
  screenshot: (format?: "png" | "jpeg") => Promise<Uint8Array>;
  close: () => Promise<void>;
};

const chromePath = () => {
  const fromEnv = Bun.env.SLIDESK_CHROME ?? Bun.env.CHROME_PATH;
  if (!fromEnv) return undefined;
  if (!existsSync(fromEnv)) throw new Error(NOT_FOUND_MESSAGE);
  return fromEnv;
};

const spawn = (width: number, height: number, path?: string) => {
  const argv = [...RENDER_FLAGS];
  if (process.getuid?.() === 0) argv.push("--no-sandbox");
  return new Bun.WebView({
    // the viewport is set here rather than resized later: chrome only accepts
    // Emulation.setDeviceMetricsOverride once a page session exists
    width,
    height,
    // printToPDF is only reachable through raw CDP, which needs chrome even
    // where webkit would be the default, and url:false keeps bun from
    // hijacking a browser the user already has open with remote debugging
    backend: { type: "chrome", url: false, argv, ...(path ? { path } : {}) },
  });
};

const toPage = (
  view: InstanceType<typeof Bun.WebView>,
  chrome: boolean,
): Page => ({
  goto: (url) => view.navigate(url),
  evaluate: <T>(expression: string) => view.evaluate(expression) as Promise<T>,
  printToPDF: chrome
    ? async (params) => {
        const { data } = (await view.cdp("Page.printToPDF", params)) as {
          data: string;
        };
        return new Uint8Array(Buffer.from(data, "base64"));
      }
    : undefined,
  screenshot: (format = "png") =>
    view.screenshot({ encoding: "buffer", format }),
  close: () => Promise.resolve(view.close()),
});

/** the system WebKit of macOS: nothing to install, but no pdf printing */
export const webkit = (width: number, height: number) =>
  toPage(new Bun.WebView({ width, height, backend: "webkit" }), false);

const open = (width: number, height: number) => {
  const fromEnv = chromePath();
  try {
    return toPage(spawn(width, height, fromEnv), true);
  } catch (e) {
    if (!(e instanceof Error && e.message.includes("Failed to spawn Chrome")))
      throw e;
    const other = fromEnv ? undefined : fallback();
    if (other) return toPage(spawn(width, height, other), true);
    if (fromEnv || platform() !== "darwin") throw new Error(NOT_FOUND_MESSAGE);
    console.warn(WEBKIT_MESSAGE);
    return webkit(width, height);
  }
};

// a missing browser throws inside the executor, so it comes out as a rejection
const launch = (width: number, height: number) =>
  new Promise<Page>((resolve) => resolve(open(width, height)));

export default launch;
