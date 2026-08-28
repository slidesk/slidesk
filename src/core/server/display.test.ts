import { beforeEach, describe, expect, it, spyOn } from "bun:test";

import { captured } from "../../__testing__/console";

// display.ts destructures `console.log` at import time; the shared capture is
// installed before this module is loaded, whatever the file order is.
const spawned: string[][] = [];
spyOn(Bun, "spawn").mockImplementation(((cmd: string[]) => {
  spawned.push(cmd);
  return {} as never;
}) as never);

const { default: display } = await import("./display");

beforeEach(() => {
  captured.clear();
  spawned.length = 0;
});

const joined = () => captured.log();

describe("display", () => {
  it("announces the presentation on the default port", async () => {
    await display({}, { ip: "192.168.0.10" });
    expect(joined()).toContain("http://192.168.0.10:1337");
    expect(joined()).toContain("http://localhost:1337");
  });

  it("uses https and the configured port", async () => {
    await display({ HTTPS: true, PORT: 8080 }, { ip: "10.0.0.1" });
    expect(joined()).toContain("https://10.0.0.1:8080");
  });

  it("announces the configured domain without duplicating localhost", async () => {
    await display({ DOMAIN: "talk.dev" }, { ip: "localhost" });
    const urls = captured.logs.filter((l) => l.includes("available on"));
    expect(urls).toHaveLength(2);
    expect(joined()).toContain("http://talk.dev:1337");
  });

  it("skips an empty ip", async () => {
    await display({}, { ip: "" });
    const urls = captured.logs.filter((l) => l.includes("available on"));
    expect(urls).toHaveLength(1);
  });

  it("announces the speaker view and prints a qrcode", async () => {
    await display({}, { ip: "127.0.0.1", notes: "notes-abc" });
    expect(joined()).toContain("speaker view");
    expect(joined()).toContain("http://127.0.0.1:1337/notes-abc");
    await Bun.sleep(50);
    expect(joined()).toContain("█");
  });

  it("opens the presentation in a browser", async () => {
    await display({}, { ip: "127.0.0.1", open: true });
    expect(spawned).toHaveLength(1);
    expect(spawned[0][1]).toBe("http://localhost:1337");
  });

  it("opens the speaker view instead when notes are served", async () => {
    await display({}, { ip: "127.0.0.1", notes: "n", open: true });
    expect(spawned).toHaveLength(1);
    expect(spawned[0][1]).toBe("http://localhost:1337/n");
  });

  it("opens the speaker view over https", async () => {
    await display({ HTTPS: true }, { ip: "127.0.0.1", notes: "n", open: true });
    expect(spawned[0][1]).toBe("https://localhost:1337/n");
  });

  it("opens nothing without the open option", async () => {
    await display({}, { ip: "127.0.0.1" });
    expect(spawned).toEqual([]);
  });
});
