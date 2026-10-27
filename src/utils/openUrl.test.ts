import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { captured } from "../__testing__/console";
import openUrl, { opener } from "./openUrl";

let spawnSpy: ReturnType<typeof spyOn> | undefined;

afterEach(() => {
  spawnSpy?.mockRestore();
  spawnSpy = undefined;
  captured.clear();
});

describe("opener", () => {
  it("uses open on macOS", () => {
    expect(opener("darwin")).toEqual(["open"]);
  });

  it("uses a program on Windows, start being a cmd builtin", () => {
    expect(opener("win32")).toEqual([
      "rundll32",
      "url.dll,FileProtocolHandler",
    ]);
  });

  it("uses xdg-open elsewhere", () => {
    expect(opener("linux")).toEqual(["xdg-open"]);
  });
});

describe("openUrl", () => {
  it("opens the url with the opener of the platform", () => {
    const calls: string[][] = [];
    spawnSpy = spyOn(Bun, "spawn").mockImplementation(((cmd: string[]) => {
      calls.push(cmd);
      return {};
    }) as never);
    openUrl("https://x.test");
    expect(calls).toEqual([[...opener(), "https://x.test"]]);
  });

  it("says where to go when no browser can be started", () => {
    spawnSpy = spyOn(Bun, "spawn").mockImplementation((() => {
      throw new Error("ENOENT");
    }) as never);
    openUrl("https://x.test");
    expect(captured.log()).toContain("Open https://x.test in your browser");
  });
});
