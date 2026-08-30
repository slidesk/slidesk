import { afterEach, describe, expect, it } from "bun:test";
import { join } from "node:path";
import type { SliDeskFile } from "../../types";
import serve from "./serve";

const fixture = join(import.meta.dir, "../../__fixtures__/talk");

const files: SliDeskFile = {
  "index.html": {
    content: "<html>exported</html>",
    headers: { "Content-Type": "text/html" },
  },
  "slidesk.css": {
    content: ".sd-slide{}",
    headers: { "Content-Type": "text/css" },
  },
};

let running: { url: string; stop: () => void } | undefined;

afterEach(() => {
  running?.stop();
  running = undefined;
});

describe("serve", () => {
  it("serves the generated presentation on an ephemeral port", async () => {
    running = await serve(files, {}, fixture);
    expect(running.url).toMatch(/^http:\/\/localhost:\d+\/$/);
    const res = await fetch(running.url);
    expect(await res.text()).toBe("<html>exported</html>");
  });

  it("serves the other generated assets", async () => {
    running = await serve(files, {}, fixture);
    const res = await fetch(`${running.url}slidesk.css`);
    expect(await res.text()).toBe(".sd-slide{}");
  });

  it("serves the talk files that are not generated", async () => {
    running = await serve(files, {}, fixture);
    const res = await fetch(`${running.url}themes/dark/theme.css`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("background");
  });

  it("answers 404 for an unknown path", async () => {
    running = await serve(files, {}, fixture);
    expect((await fetch(`${running.url}nope.png`)).status).toBe(404);
  });

  it("loads the talk plugins", async () => {
    // the fixture plugin declares no route, so the server still answers 404,
    // but the plugin directory has been scanned without throwing
    running = await serve(files, {}, fixture);
    expect((await fetch(`${running.url}anything`)).status).toBe(404);
  });

  it("also loads the plugins of the common directory", async () => {
    running = await serve(
      files,
      { slidesk: { COMMON_DIR: "themes/dark" } },
      fixture,
    );
    expect((await fetch(running.url)).status).toBe(200);
  });

  it("broadcasts a websocket message to the other viewers", async () => {
    running = await serve(files, {}, fixture);
    const wsUrl = `${running.url.replace("http://", "ws://")}ws`;
    const listener = new WebSocket(wsUrl);
    const sender = new WebSocket(wsUrl);
    await Promise.all([
      new Promise((r) => listener.addEventListener("open", r)),
      new Promise((r) => sender.addEventListener("open", r)),
    ]);
    const received = new Promise<string>((resolve) => {
      listener.addEventListener("message", (e) => resolve(String(e.data)));
    });
    sender.send("next");
    expect(await received).toBe("next");
    listener.close();
    sender.close();
    await Bun.sleep(20);
  });

  it("stops accepting connections once stopped", async () => {
    const server = await serve(files, {}, fixture);
    const { url } = server;
    server.stop();
    expect(fetch(url)).rejects.toThrow();
  });
});
