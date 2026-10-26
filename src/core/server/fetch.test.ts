import { describe, expect, it } from "bun:test";
import type { Server } from "bun";
import type {
  SliDeskFile,
  SliDeskServerPlugin,
  SliDeskSocketData,
} from "../../types";
import fetchHandler, { canSend } from "./fetch";

const files: SliDeskFile = {
  "index.html": {
    content: "<html>home</html>",
    headers: { "Content-Type": "text/html" },
  },
  "styles.css": {
    content: "body{}",
    headers: { "Content-Type": "text/css" },
  },
};

const fakeServer = (upgraded: boolean) =>
  ({
    upgrade: () => upgraded,
    requestIP: () => null,
  }) as unknown as Server<SliDeskSocketData>;

const request = (path: string) =>
  new Request(`http://localhost${path}`, { headers: { host: "localhost" } });

describe("fetch", () => {
  it("upgrades a websocket request", async () => {
    const res = await fetchHandler(
      request("/ws"),
      fakeServer(true),
      files,
      [],
      ".",
      {},
    );
    expect(res).toBeUndefined();
  });

  it("returns a 400 when the upgrade fails", async () => {
    const res = await fetchHandler(
      request("/ws"),
      fakeServer(false),
      files,
      [],
      ".",
      {},
    );
    expect(res?.status).toBe(400);
    expect(await res?.text()).toBe("WebSocket upgrade error");
  });

  it("serves index.html at the root", async () => {
    const res = await fetchHandler(
      request("/"),
      fakeServer(false),
      files,
      [],
      ".",
      {},
    );
    expect(await res?.text()).toBe("<html>home</html>");
    expect(res?.headers.get("Content-Type")).toContain("text/html");
  });

  it("serves any other generated file", async () => {
    const res = await fetchHandler(
      request("/styles.css"),
      fakeServer(false),
      files,
      [],
      ".",
      {},
    );
    expect(await res?.text()).toBe("body{}");
  });

  it("lets a plugin answer an unknown route", async () => {
    const plugins = [
      { name: "p", addRoutes: async () => new Response("from plugin") },
    ] satisfies SliDeskServerPlugin[];
    const res = await fetchHandler(
      request("/custom"),
      fakeServer(false),
      files,
      plugins,
      ".",
      {},
    );
    expect(await res?.text()).toBe("from plugin");
  });

  it("passes the request, env and path to the plugin", async () => {
    const seen: unknown[] = [];
    const plugins = [
      {
        name: "p",
        addRoutes: async (req: Request, env: unknown, path: string) => {
          seen.push(req.url, env, path);
          return new Response("ok");
        },
      },
    ] satisfies SliDeskServerPlugin[];
    await fetchHandler(
      request("/custom"),
      fakeServer(false),
      files,
      plugins,
      "/talk",
      { LANG: "fr" },
    );
    expect(seen).toEqual(["http://localhost/custom", { LANG: "fr" }, "/talk"]);
  });

  it("keeps the first plugin answer when a later plugin declines", async () => {
    const plugins = [
      { name: "a", addRoutes: async () => new Response("from a") },
      { name: "b", addRoutes: async () => null },
    ] satisfies SliDeskServerPlugin[];
    const res = await fetchHandler(
      request("/custom"),
      fakeServer(false),
      files,
      plugins,
      ".",
      {},
    );
    expect(await res?.text()).toBe("from a");
  });

  it("skips plugins without an addRoutes hook", async () => {
    const plugins = [{ name: "p" }] satisfies SliDeskServerPlugin[];
    const res = await fetchHandler(
      request("/missing.png"),
      fakeServer(false),
      files,
      plugins,
      ".",
      {},
    );
    expect(res?.status).toBe(404);
  });

  it("falls back to the static file handler when no plugin answers", async () => {
    const res = await fetchHandler(
      request("/package.json"),
      fakeServer(false),
      files,
      [],
      ".",
      {},
    );
    expect(res?.status).toBe(200);
    expect(await res?.text()).toContain("slidesk");
  });
});

describe("canSend", () => {
  it("lets the speaker's own machine drive the talk", () => {
    expect(canSend("127.0.0.1", null, "secret")).toBe(true);
    expect(canSend("::1", null, "secret")).toBe(true);
    expect(canSend("::ffff:127.0.0.1", null, "secret")).toBe(true);
  });

  it("keeps any other viewer read-only", () => {
    expect(canSend("203.0.113.7", null, "secret")).toBe(false);
    expect(canSend("203.0.113.7", "guess", "secret")).toBe(false);
    expect(canSend(undefined, null, "secret")).toBe(false);
  });

  it("lets a remote speaker view in with the token", () => {
    expect(canSend("203.0.113.7", "secret", "secret")).toBe(true);
  });

  it("never matches a missing token", () => {
    expect(canSend("203.0.113.7", null, undefined)).toBe(false);
  });
});
