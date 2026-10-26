import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { existsSync } from "node:fs";
import { hubFetch, withTempDir } from "./hub";

let fetchSpy: ReturnType<typeof spyOn> | undefined;

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
});

describe("hubFetch", () => {
  it("returns the response of the hub", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
      (async () => new Response("ok")) as never,
    );
    expect(await (await hubFetch("https://link.test/x")).text()).toBe("ok");
  });

  it("reports an unreachable hub", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async () => {
      throw new TypeError("fetch failed");
    }) as never);
    expect(hubFetch("https://link.test/x")).rejects.toThrow(
      "Cannot reach https://link.test/x",
    );
  });
});

describe("withTempDir", () => {
  it("removes the directory even when its user fails", async () => {
    let used = "";
    await expect(
      withTempDir(async (dir) => {
        used = dir;
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(used).not.toBe("");
    expect(existsSync(used)).toBe(false);
  });
});
