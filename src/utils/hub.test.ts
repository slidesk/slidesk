import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { list } from "tar";
import { hubFetch, withTarball, withTempDir } from "./hub";

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

describe("hubFetch timeout", () => {
  it("gives up on a request that gets no answer, not on an upload", async () => {
    const signals: (AbortSignal | null | undefined)[] = [];
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async (
      _: string,
      init?: RequestInit,
    ) => {
      signals.push(init?.signal);
      return new Response("ok");
    }) as never);
    await hubFetch("https://link.test/x");
    await hubFetch("https://link.test/x", { method: "post", body: "data" });
    expect(signals[0]).toBeInstanceOf(AbortSignal);
    expect(signals[1]).toBeUndefined();
  });

  it("reports a hub that does not answer in time", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async () => {
      throw new DOMException("timed out", "TimeoutError");
    }) as never);
    expect(hubFetch("https://link.test/x")).rejects.toThrow(
      "https://link.test/x did not answer within 60s",
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

describe("withTarball", () => {
  it("leaves the git history of an addon out", async () =>
    withTempDir(async (dir) => {
      mkdirSync(join(dir, "my-theme/.git"), { recursive: true });
      writeFileSync(join(dir, "my-theme/.git/config"), "token");
      writeFileSync(join(dir, "my-theme/.gitignore"), "");
      writeFileSync(join(dir, "my-theme/theme.json"), "{}");
      const entries: string[] = [];
      await withTarball(dir, ["my-theme"], async (tarball) => {
        await list({
          file: tarball.name ?? "",
          onReadEntry: (e) => entries.push(e.path),
        });
      });
      expect(entries.sort()).toEqual([
        "my-theme/",
        "my-theme/.gitignore",
        "my-theme/theme.json",
      ]);
    }));
});
