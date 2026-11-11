import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import packagejson from "../../../package.json";
import { makeTarball, recordingFetch } from "../../__testing__/addons";
import { captured } from "../../__testing__/console";
import { runCommand } from "../../utils/cliError";
import upgradeCmd from "./index";

const NEXT = "99.0.0";
const RELEASES = "https://github.com/slidesk/slidesk/releases";

let dir: string;
let fetchSpy: ReturnType<typeof spyOn> | undefined;
const real = {
  execPath: process.execPath,
  platform: process.platform,
  arch: process.arch,
};

const fake = (key: keyof typeof real, value: string) =>
  Object.defineProperty(process, key, { value, configurable: true });

/** Runs as the compiled binary `exe`, on linux-x64 unless told otherwise. */
const binary = (exe = join(dir, "slidesk")) => {
  writeFileSync(exe, "old");
  fake("execPath", exe);
  fake("platform", "linux");
  fake("arch", "x64");
  return exe;
};

const stubFetch = (
  responder: (url: string) => Response | Promise<Response>,
) => {
  const { urls, impl } = recordingFetch(responder);
  fetchSpy = spyOn(globalThis, "fetch").mockImplementation(impl as never);
  return urls;
};

/** GitHub announces `tag`, and serves `asset` as a release tarball. */
const release = (tag = NEXT, asset = "slidesk_linux-amd") =>
  stubFetch(async (url) =>
    url.includes("api.github.com")
      ? Response.json({ tag_name: tag })
      : new Response(await makeTarball(".", { [asset]: "new" })),
  );

const run = () => runCommand(() => upgradeCmd.ready([]));

beforeEach(() => {
  captured.clear();
  dir = mkdtempSync(join(tmpdir(), "slidesk-upgrade-"));
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
  for (const [key, value] of Object.entries(real))
    fake(key as keyof typeof real, value);
  chmodSync(dir, 0o755);
  rmSync(dir, { recursive: true, force: true });
});

describe("upgrade command", () => {
  it("replaces the binary with the one of the latest release", async () => {
    const exe = binary();
    const urls = release();
    expect(await run()).toBe(0);
    expect(urls[1]).toBe(
      `${RELEASES}/download/${NEXT}/slidesk_linux-amd.tar.gz`,
    );
    expect(readFileSync(exe, "utf8")).toBe("new");
    expect(statSync(exe).mode & 0o777).toBe(0o755);
    expect(captured.log()).toContain(
      `SliDesk upgraded from ${packagejson.version} to ${NEXT}`,
    );
  });

  it("downloads the binary of the platform", async () => {
    binary();
    fake("platform", "darwin");
    fake("arch", "arm64");
    const urls = release(NEXT, "slidesk_mac");
    expect(await run()).toBe(0);
    expect(urls[1]).toEndWith("/slidesk_mac.tar.gz");
  });

  it("says when SliDesk is up to date", async () => {
    const exe = binary();
    const urls = release(packagejson.version);
    expect(await run()).toBe(0);
    expect(urls).toHaveLength(1);
    expect(readFileSync(exe, "utf8")).toBe("old");
    expect(captured.log()).toContain("is up to date");
  });

  it("does nothing when SliDesk runs through bun", async () => {
    fake("execPath", "/usr/local/bin/bun");
    const urls = release();
    expect(await run()).toBe(1);
    expect(urls).toEqual([]);
    expect(captured.error()).toContain("bunx slidesk@latest");
  });

  it("fails when the latest release cannot be read", async () => {
    binary();
    stubFetch(() => {
      throw new Error("offline");
    });
    expect(await run()).toBe(1);
    expect(captured.error()).toContain("could not read the latest");
  });

  it("upgrades a Homebrew install with brew", async () => {
    const cellar = join(dir, "Cellar/slidesk/1.0.0/bin");
    mkdirSync(cellar, { recursive: true });
    const exe = binary(join(cellar, "slidesk"));
    const urls = release();
    const spawn = spyOn(Bun, "spawn").mockImplementation((() => ({
      exited: Promise.resolve(0),
    })) as never);
    try {
      expect(await run()).toBe(0);
      // other test files may still be spawning when this spy is installed
      expect(spawn.mock.calls.map(([cmd]) => cmd)).toContainEqual([
        "brew",
        "upgrade",
        "gouz/tools/slidesk",
      ]);
      expect(urls).toHaveLength(1);
      expect(readFileSync(exe, "utf8")).toBe("old");

      spawn.mockImplementation((() => ({
        exited: Promise.resolve(1),
      })) as never);
      expect(await run()).toBe(1);
      expect(captured.error()).toContain("brew upgrade failed");
    } finally {
      spawn.mockRestore();
    }
  });

  it("points to the release on a platform without a binary", async () => {
    binary();
    fake("platform", "win32");
    release();
    expect(await run()).toBe(1);
    expect(captured.error()).toContain(`${RELEASES}/latest`);
  });

  it("keeps the binary when the download fails", async () => {
    const exe = binary();
    stubFetch((url) =>
      url.includes("api.github.com")
        ? Response.json({ tag_name: NEXT })
        : new Response("nope", { status: 404 }),
    );
    expect(await run()).toBe(1);
    expect(captured.error()).toContain(`could not download SliDesk ${NEXT}`);
    expect(readFileSync(exe, "utf8")).toBe("old");
  });

  it("asks for sudo when the binary is not writable", async () => {
    if (process.getuid?.() === 0) return; // root writes anywhere
    const exe = binary();
    release();
    chmodSync(dir, 0o555);
    expect(await run()).toBe(1);
    expect(captured.error()).toContain("sudo slidesk upgrade");
    expect(readFileSync(exe, "utf8")).toBe("old");
  });

  it("does not leave a half-written binary when the archive is wrong", async () => {
    const exe = binary();
    release(NEXT, "something_else");
    await expect(run()).rejects.toThrow();
    expect(readFileSync(exe, "utf8")).toBe("old");
    expect(existsSync(`${exe}.new`)).toBe(false);
  });
});
