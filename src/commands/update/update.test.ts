import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ExitError,
  makeTarball,
  recordingFetch,
  useTempCwd,
} from "../../__testing__/addons";
import { captured } from "../../__testing__/console";
import { runCommand } from "../../utils/cliError";
import updateCmd from "./index";

const exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new ExitError(code);
}) as never);

const LINK = "https://link.test";
let cwd: ReturnType<typeof useTempCwd>;
let fetchSpy: ReturnType<typeof spyOn> | undefined;

const stubFetch = (
  responder: (url: string) => Response | Promise<Response>,
) => {
  const { urls, impl } = recordingFetch(responder);
  fetchSpy = spyOn(globalThis, "fetch").mockImplementation(impl as never);
  return urls;
};

const run = async (argv: string[]) => {
  try {
    return await runCommand(() =>
      updateCmd.ready([...argv, "--slidesk-link-url", LINK]),
    );
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
    return e.code;
  }
};

/** A talk with one addon of each kind from the hub, and one of each written by hand. */
const installed = () => {
  for (const kind of ["plugins", "themes", "templates"]) {
    mkdirSync(join(cwd.dir, kind, "bob__one"), { recursive: true });
    mkdirSync(join(cwd.dir, kind, "mine"), { recursive: true });
  }
  mkdirSync(join(cwd.dir, "components"), { recursive: true });
  writeFileSync(join(cwd.dir, "components/bob__shout.mjs"), "old");
  writeFileSync(join(cwd.dir, "components/mine.mjs"), "mine");
};

const tarballFor = async (url: string) =>
  url.includes("/component/")
    ? makeTarball(".", { "shout.mjs": "new" })
    : makeTarball("one", {
        "plugin.json": "{}",
        "theme.json": "{}",
        "template.json": "{}",
      });

beforeEach(() => {
  captured.clear();
  exitSpy.mockClear();
  cwd = useTempCwd();
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
  cwd.restore();
});

describe("update command", () => {
  it("updates every addon from the hub, and leaves the others", async () => {
    installed();
    const urls = stubFetch(async (url) => new Response(await tarballFor(url)));
    expect(await run([])).toBe(0);
    expect(urls.sort()).toEqual(
      [
        "component/bob/shout",
        "plugin/bob/one",
        "template/bob/one",
        "theme/bob/one",
      ]
        .map((p) => `${LINK}/addons/download/${p}`)
        .sort(),
    );
    expect(
      readFileSync(join(cwd.dir, "components/bob__shout.mjs"), "utf8"),
    ).toBe("new");
    expect(readFileSync(join(cwd.dir, "components/mine.mjs"), "utf8")).toBe(
      "mine",
    );
  });

  it("updates only the kind asked, singular or plural", async () => {
    installed();
    const urls = stubFetch(async (url) => new Response(await tarballFor(url)));
    expect(await run(["themes"])).toBe(0);
    expect(await run(["component"])).toBe(0);
    expect(urls).toEqual([
      `${LINK}/addons/download/theme/bob/one`,
      `${LINK}/addons/download/component/bob/shout`,
    ]);
  });

  it("refuses an unknown kind", async () => {
    expect(await run(["skins"])).toBe(1);
    expect(captured.error()).toContain(
      "skins is not plugins, components, themes or templates",
    );
  });

  it("says when there is nothing to update", async () => {
    expect(await run([])).toBe(0);
    expect(captured.log()).toContain("nothing to update");
  });

  it("goes on after an addon that fails, then exits with an error", async () => {
    installed();
    stubFetch(async (url) =>
      url.includes("/plugin/")
        ? new Response("", { status: 404 })
        : new Response(await tarballFor(url)),
    );
    expect(await run([])).toBe(1);
    expect(captured.error()).toContain("plugin bob/one not found");
    expect(captured.error()).toContain("1 addon(s) could not be updated");
    expect(captured.log()).toContain("theme bob/one updated");
  });
});
