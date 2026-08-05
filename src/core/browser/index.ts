import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import CDP from "./cdp";
import findBrowser, { NOT_FOUND_MESSAGE } from "./find";

const PORT_FILE_TIMEOUT = 30_000;

const flags = (userDataDir: string) => {
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--mute-audio",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-dev-shm-usage",
    "--force-color-profile=srgb",
    "--font-render-hinting=none",
    // ignored by other chromium builds, keeps vivaldi's renderer alive
    "--disable-vivaldi",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
  ];
  if (process.getuid?.() === 0) args.push("--no-sandbox");
  args.push("about:blank");
  return args;
};

const waitForPortFile = async (file: string) => {
  const deadline = Date.now() + PORT_FILE_TIMEOUT;
  while (Date.now() < deadline) {
    if (existsSync(file)) {
      const [port, wsPath] = readFileSync(file, "utf8").split("\n");
      if (port && wsPath) return `ws://127.0.0.1:${port}${wsPath}`;
    }
    await Bun.sleep(50);
  }
  throw new Error("the browser did not expose its debugging port in time");
};

export type Page = {
  goto: (url: string) => Promise<void>;
  evaluate: <T>(expression: string) => Promise<T>;
  setViewport: (width: number, height: number) => Promise<void>;
  printToPDF: (params: Record<string, unknown>) => Promise<Uint8Array>;
  screenshot: () => Promise<Uint8Array>;
  close: () => Promise<void>;
};

const launch = async (): Promise<Page> => {
  const binary = findBrowser();
  if (binary === null) throw new Error(NOT_FOUND_MESSAGE);

  const userDataDir = mkdtempSync(path.join(tmpdir(), "slidesk-export-"));
  const proc = Bun.spawn([binary, ...flags(userDataDir)], {
    stdout: "ignore",
    stderr: "ignore",
  });

  let cdp: CDP | null = null;
  const cleanup = async () => {
    cdp?.close();
    proc.kill();
    await proc.exited;
    rmSync(userDataDir, { recursive: true, force: true });
  };

  try {
    const wsUrl = await waitForPortFile(
      path.join(userDataDir, "DevToolsActivePort"),
    );
    cdp = await CDP.connect(wsUrl);
    const { targetId } = (await cdp.send("Target.createTarget", {
      url: "about:blank",
    })) as { targetId: string };
    const { sessionId } = (await cdp.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    })) as { sessionId: string };
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    const client = cdp;

    return {
      goto: async (url) => {
        const loaded = client.once("Page.loadEventFired");
        await client.send("Page.navigate", { url }, sessionId);
        await loaded;
      },
      evaluate: async <T>(expression: string) => {
        const res = (await client.send(
          "Runtime.evaluate",
          { expression, awaitPromise: true, returnByValue: true },
          sessionId,
        )) as {
          result?: { value?: T };
          exceptionDetails?: { exception?: { description?: string } };
        };
        if (res.exceptionDetails)
          throw new Error(
            res.exceptionDetails.exception?.description ??
              "evaluation failed in the browser",
          );
        return res.result?.value as T;
      },
      setViewport: async (width, height) => {
        await client.send(
          "Emulation.setDeviceMetricsOverride",
          { width, height, deviceScaleFactor: 1, mobile: false },
          sessionId,
        );
      },
      printToPDF: async (params) => {
        const { data } = (await client.send(
          "Page.printToPDF",
          params,
          sessionId,
        )) as { data: string };
        return new Uint8Array(Buffer.from(data, "base64"));
      },
      screenshot: async () => {
        const { data } = (await client.send(
          "Page.captureScreenshot",
          { format: "png", captureBeyondViewport: false },
          sessionId,
        )) as { data: string };
        return new Uint8Array(Buffer.from(data, "base64"));
      },
      close: cleanup,
    };
  } catch (e) {
    await cleanup();
    throw e;
  }
};

export default launch;
