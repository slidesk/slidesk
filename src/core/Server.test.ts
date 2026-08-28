import { beforeEach, describe, expect, it } from "bun:test";
import { join } from "node:path";
import { captured } from "../__testing__/console";
import type { SliDeskFile } from "../types";
import SlideskServer from "./Server";

const talk = join(import.meta.dir, "../__fixtures__/server-talk");

const files: SliDeskFile = {
  "index.html": {
    content: "<html>served</html>",
    headers: { "Content-Type": "text/html" },
  },
};

/**
 * The server binds the configured port and exposes no way to stop it, so each
 * test gets its own free port: a throwaway server is opened on port 0, its
 * port read back, then released.
 */
const freePort = () => {
  const probe = Bun.serve({ port: 0, fetch: () => new Response("") });
  const { port } = probe;
  probe.stop(true);
  return port;
};

const env = (extra: Record<string, unknown> = {}) => ({
  slidesk: { PORT: freePort(), ...extra },
});

let slidesk: SlideskServer;
let base = "";

const start = async (envValue = env()) => {
  slidesk = new SlideskServer();
  await slidesk.create(files, { ip: "127.0.0.1" }, envValue, talk);
  // the served url is only reachable through what the server announced
  base =
    captured.logs
      .map((l) => /(http:\/\/127\.0\.0\.1:\d+)/.exec(l)?.[1])
      .find((u) => u !== undefined) ?? "";
  return base;
};

const socket = async () => {
  const ws = new WebSocket(`${base.replace("http", "ws")}/ws`);
  await new Promise((r) => ws.addEventListener("open", r));
  return ws;
};

const nextMessage = (ws: WebSocket) =>
  new Promise<Record<string, unknown>>((resolve) => {
    ws.addEventListener("message", (e) => resolve(JSON.parse(String(e.data))));
  });

beforeEach(() => {
  captured.clear();
});

describe("SlideskServer", () => {
  it("serves the presentation and announces its url", async () => {
    const url = await start();
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(await (await fetch(url)).text()).toBe("<html>served</html>");
  });

  it("serves the files of the talk directory", async () => {
    const url = await start();
    const res = await fetch(`${url}/style.css`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("color");
  });

  it("answers 404 for an unknown path", async () => {
    const url = await start();
    expect((await fetch(`${url}/nope`)).status).toBe(404);
  });

  it("routes a request through a plugin of the common directory", async () => {
    const url = await start(env({ COMMON_DIR: "shared" }));
    expect(await (await fetch(`${url}/from-common`)).text()).toBe(
      "common route",
    );
  });

  it("relays a plain websocket message to the other viewers", async () => {
    await start();
    const listener = await socket();
    const sender = await socket();
    const received = nextMessage(listener);
    sender.send(JSON.stringify({ action: "next" }));
    expect((await received).action).toBe("next");
    listener.close();
    sender.close();
  });

  it("answers a websocket message addressed to a plugin", async () => {
    await start();
    const ws = await socket();
    const received = nextMessage(ws);
    ws.send(JSON.stringify({ plugin: "echo", payload: "ping" }));
    expect(await received).toEqual({
      action: "echo_response",
      response: "echo:ping",
    });
    ws.close();
  });

  it("tells the viewers to reload when the files change", async () => {
    await start();
    const ws = await socket();
    const received = nextMessage(ws);
    slidesk.setFiles({
      "index.html": {
        content: "<html>updated</html>",
        headers: { "Content-Type": "text/html" },
      },
    });
    expect(await received).toEqual({ action: "reload" });
    expect(await (await fetch(base)).text()).toBe("<html>updated</html>");
    ws.close();
  });

  it("sends an action with its payload", async () => {
    await start();
    const ws = await socket();
    const received = nextMessage(ws);
    slidesk.send("goto", 3);
    expect(await received).toEqual({ action: "goto", data: 3 });
    ws.close();
  });
});
