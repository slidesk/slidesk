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
      .map((c) =>
        c.startsWith("/") ? (existsSync(c) ? c : null) : Bun.which(c),
      )
      .find((c) => c !== null && c !== undefined) ?? undefined
  );
};

export const NOT_FOUND_MESSAGE = `🤔 No Chromium-based browser found.
   Exporting needs Chrome, Chromium, Edge, Brave or Vivaldi installed.
   Set SLIDESK_CHROME=/path/to/browser to point at a specific one.`;

export type Page = {
  goto: (url: string) => Promise<void>;
  evaluate: <T>(expression: string) => Promise<T>;
  printToPDF: (params: Record<string, unknown>) => Promise<Uint8Array>;
  screenshot: () => Promise<Uint8Array>;
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

const open = (width: number, height: number) => {
  const fromEnv = chromePath();
  try {
    return spawn(width, height, fromEnv);
  } catch (e) {
    if (!(e as Error).message.includes("Failed to spawn Chrome")) throw e;
    const other = fromEnv ? undefined : fallback();
    if (!other) throw new Error(NOT_FOUND_MESSAGE);
    return spawn(width, height, other);
  }
};

const launch = async (width: number, height: number): Promise<Page> => {
  const view = open(width, height);
  return {
    goto: (url) => view.navigate(url),
    evaluate: <T>(expression: string) =>
      view.evaluate(expression) as Promise<T>,
    printToPDF: async (params) => {
      const { data } = (await view.cdp("Page.printToPDF", params)) as {
        data: string;
      };
      return new Uint8Array(Buffer.from(data, "base64"));
    },
    screenshot: () => view.screenshot({ encoding: "buffer" }),
    close: async () => {
      view.close();
    },
  };
};

export default launch;
