import { existsSync } from "node:fs";
import { platform } from "node:os";

const MACOS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Vivaldi.app/Contents/MacOS/Vivaldi",
];

const LINUX = [
  "google-chrome",
  "google-chrome-stable",
  "chromium",
  "chromium-browser",
  "microsoft-edge",
  "brave-browser",
  "vivaldi",
];

const WINDOWS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
];

const findBrowser = (): string | null => {
  const fromEnv = Bun.env.SLIDESK_CHROME ?? Bun.env.CHROME_PATH;
  if (fromEnv) return existsSync(fromEnv) ? fromEnv : null;

  const os = platform();
  if (os === "darwin") return MACOS.find((p) => existsSync(p)) ?? null;
  if (os === "win32") return WINDOWS.find((p) => existsSync(p)) ?? null;
  return LINUX.map((name) => Bun.which(name)).find((p) => p !== null) ?? null;
};

export const NOT_FOUND_MESSAGE = `🤔 No Chromium-based browser found.
   Exporting needs Chrome, Chromium, Edge, Brave or Vivaldi installed.
   Set SLIDESK_CHROME=/path/to/browser to point at a specific one.`;

export default findBrowser;
