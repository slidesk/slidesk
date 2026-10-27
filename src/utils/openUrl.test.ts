import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { captured } from "../__testing__/console";

let spawnSpy: ReturnType<typeof spyOn> | undefined;

afterEach(() => {
  spawnSpy?.mockRestore();
  spawnSpy = undefined;
  captured.clear();
});

const withPlatform = async (platform: string) => {
  mock.module("node:process", () => ({ platform }));
  return import(`./openUrl?${platform}`);
};

describe("opener", () => {
  it("uses open on macOS", async () => {
    expect((await withPlatform("darwin")).opener()).toEqual(["open"]);
  });

  it("uses a program on Windows, start being a cmd builtin", async () => {
    expect((await withPlatform("win32")).opener()).toEqual([
      "rundll32",
      "url.dll,FileProtocolHandler",
    ]);
  });

  it("uses xdg-open elsewhere", async () => {
    expect((await withPlatform("linux")).opener()).toEqual(["xdg-open"]);
  });
});

describe("openUrl", () => {
  it("opens the url with the opener", async () => {
    const calls: string[][] = [];
    spawnSpy = spyOn(Bun, "spawn").mockImplementation(((cmd: string[]) => {
      calls.push(cmd);
      return {};
    }) as never);
    const { default: openUrl } = await withPlatform("darwin");
    openUrl("https://x.test");
    expect(calls).toEqual([["open", "https://x.test"]]);
  });

  it("says where to go when no browser can be started", async () => {
    spawnSpy = spyOn(Bun, "spawn").mockImplementation((() => {
      throw new Error("ENOENT");
    }) as never);
    const { default: openUrl } = await withPlatform("linux");
    openUrl("https://x.test");
    expect(captured.log()).toContain("Open https://x.test in your browser");
  });
});
