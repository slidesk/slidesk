import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ExitError,
  makeTarball,
  recordingFetch,
  useTempCwd,
} from "../../__testing__/addons";
import { captured } from "../../__testing__/console";

const exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new ExitError(code);
}) as never);

let selection: string[] = [];
mock.module("@clack/prompts", () => ({ multiselect: async () => selection }));
mock.module("../../utils/getLinkToken", () => ({
  default: async () => "a-token",
}));

// These modules destructure `console` at import time and nothing else in the
// suite imports them, so the spies above are already in place.
const { themeInstall } = await import("./install");
const { themeRemove } = await import("./remove");
const { default: themeCmd } = await import("./index");

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
    await themeCmd.ready(argv);
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
    return e.code;
  }
  return undefined;
};

const installedTheme = (name: string) => {
  mkdirSync(join(cwd.dir, "themes", name), { recursive: true });
  writeFileSync(join(cwd.dir, "themes", name, "theme.json"), "{}");
};

beforeEach(() => {
  captured.clear();
  selection = [];
  exitSpy.mockClear();
  cwd = useTempCwd();
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
  cwd.restore();
});

// mock.restore() is deliberately not called here: it would also undo the
// process-wide console spy the tests share, and Bun keeps module mocks
// registered for the lifetime of the process anyway.

describe("themeInstall", () => {
  it("refuses an empty name", async () => {
    expect(await themeInstall("")).toBe("Please provide a name for the theme");
  });

  it("downloads a theme and flattens it into its own directory", async () => {
    const tarball = await makeTarball("dark", {
      "theme.json": '{"name":"dark"}',
      "theme.css": "body{}",
    });
    const urls = stubFetch(async () => new Response(tarball));
    const res = await themeInstall("@bob__dark", LINK);
    expect(urls).toEqual([`${LINK}/addons/download/theme/bob/dark`]);
    expect(res).toBe("theme @bob/dark installed");
    expect(existsSync(join(cwd.dir, "themes/@bob__dark/theme.css"))).toBe(true);
    expect(existsSync(join(cwd.dir, "themes/@bob__dark/dark"))).toBe(false);
    expect(existsSync(join(cwd.dir, "themes/@bob__dark/link.tgz"))).toBe(false);
  });

  it("reports an update rather than an install", async () => {
    const tarball = await makeTarball("dark", { "theme.json": "{}" });
    stubFetch(async () => new Response(tarball));
    expect(await themeInstall("bob__dark", LINK, true)).toBe(
      "theme bob/dark updated",
    );
  });

  it("reports a theme missing from the hub", async () => {
    stubFetch(async () => new Response("", { status: 404 }));
    expect(await themeInstall("bob__ghost", LINK)).toBe("");
    expect(captured.error()).toContain("theme bob/ghost not found");
  });
});

describe("themeRemove", () => {
  it("refuses an empty name", async () => {
    expect(await themeRemove("")).toBe("Please provide a name for the theme");
  });

  it("reports a theme that is not installed", async () => {
    expect(await themeRemove("ghost")).toBe("theme not found");
  });

  it("deletes an installed theme", async () => {
    installedTheme("dark");
    expect(await themeRemove("dark")).toBe("theme dark removed");
    expect(existsSync(join(cwd.dir, "themes/dark"))).toBe(false);
  });
});

describe("theme command", () => {
  it("exposes the five subcommands", () => {
    expect(themeCmd.name).toBe("theme");
    const help = themeCmd.helpText();
    for (const sub of ["install", "remove", "update", "search", "push"])
      expect(help).toContain(sub);
  });

  it("installs through the install subcommand", async () => {
    const tarball = await makeTarball("dark", { "theme.json": "{}" });
    stubFetch(async () => new Response(tarball));
    expect(await run(["install", "bob/dark", "--slidesk-link-url", LINK])).toBe(
      0,
    );
    expect(captured.log()).toContain("installed");
  });

  it("removes through the remove subcommand", async () => {
    installedTheme("dark");
    expect(await run(["remove", "dark"])).toBe(0);
    expect(captured.log()).toContain("removed");
  });

  it("reinstalls through the update subcommand", async () => {
    const tarball = await makeTarball("dark", { "theme.json": "{}" });
    stubFetch(async () => new Response(tarball));
    installedTheme("bob__dark");
    expect(await run(["update", "bob__dark", "--slidesk-link-url", LINK])).toBe(
      0,
    );
    expect(captured.log()).toContain("updated");
    expect(existsSync(join(cwd.dir, "themes/bob__dark/theme.json"))).toBe(true);
  });

  it("installs the themes picked in the search results", async () => {
    const tarball = await makeTarball("dark", { "theme.json": "{}" });
    selection = ["bob__dark"];
    const urls = stubFetch(async (url) =>
      url.includes("/search/")
        ? Response.json(["bob/dark"])
        : new Response(tarball),
    );
    expect(await run(["search", "dar", "--slidesk-link-url", LINK])).toBe(0);
    expect(urls[0]).toBe(`${LINK}/addons/search/theme/dar`);
    expect(urls[1]).toBe(`${LINK}/addons/download/theme/bob/dark`);
  });

  it("exits when the search finds nothing", async () => {
    stubFetch(async () => new Response("", { status: 404 }));
    expect(await run(["search", "nope", "--slidesk-link-url", LINK])).toBe(1);
    expect(captured.error()).toContain("No theme with this name is found");
  });

  it("exits when the search term is missing", async () => {
    expect(await run(["search"])).toBe(1);
    expect(captured.error()).toContain("Please provide a search term");
  });

  it("pushes a theme with its readme and previews", async () => {
    mkdirSync(join(cwd.dir, "mine/preview"), { recursive: true });
    writeFileSync(join(cwd.dir, "mine/theme.json"), "{}");
    writeFileSync(join(cwd.dir, "mine/README.md"), "# Mine");
    writeFileSync(join(cwd.dir, "mine/preview/shot.webp"), "fake-image");
    const urls = stubFetch(async () => new Response("", { status: 201 }));
    expect(await run(["push", "mine", "--slidesk-link-url", LINK])).toBe(0);
    expect(urls).toEqual([`${LINK}/addons`]);
    expect(captured.log()).toContain("added or updated into the hub");
    expect(existsSync(join(cwd.dir, "link.tgz"))).toBe(false);
  });

  it("pushes a theme that has no preview directory", async () => {
    mkdirSync(join(cwd.dir, "bare"), { recursive: true });
    writeFileSync(join(cwd.dir, "bare/theme.json"), "{}");
    stubFetch(async () => new Response("", { status: 201 }));
    expect(await run(["push", "bare", "--slidesk-link-url", LINK])).toBe(0);
    expect(captured.log()).toContain("added or updated into the hub");
  });

  it("reports a rejected push", async () => {
    mkdirSync(join(cwd.dir, "mine"), { recursive: true });
    writeFileSync(join(cwd.dir, "mine/theme.json"), "{}");
    stubFetch(async () => new Response("nope", { status: 400 }));
    expect(await run(["push", "mine", "--slidesk-link-url", LINK])).toBe(0);
    expect(captured.error()).toContain("nope");
  });

  it("exits when the push has no theme name", async () => {
    expect(await run(["push"])).toBe(1);
    expect(captured.error()).toContain("Please provide a theme name");
  });
});
