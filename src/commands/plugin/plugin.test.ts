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
import { runCommand } from "../../utils/cliError";

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
const { addonInstall, addonRemove } = await import("../../utils/addon");
const pluginInstall = (...a: [string, string?, boolean?, string?]) =>
  addonInstall("plugin", ...a);
const pluginRemove = (name: string) => addonRemove("plugin", name);
const { default: pluginCmd } = await import("./index");

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
    return await runCommand(() => pluginCmd.ready(argv));
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
    return e.code;
  }
};

const installedPlugin = (name: string) => {
  mkdirSync(join(cwd.dir, "plugins", name), { recursive: true });
  writeFileSync(join(cwd.dir, "plugins", name, "plugin.json"), "{}");
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

describe("pluginInstall", () => {
  it("refuses an empty name", async () => {
    await expect(pluginInstall("")).rejects.toThrow(
      "Please provide a plugin name",
    );
  });

  it("downloads a plugin and flattens it into its own directory", async () => {
    const tarball = await makeTarball("timer", {
      "plugin.json": '{"name":"timer"}',
      "timer.js": "console.log(1);",
    });
    const urls = stubFetch(async () => new Response(tarball));
    const res = await pluginInstall("@bob__timer", LINK);
    expect(urls).toEqual([`${LINK}/addons/download/plugin/bob/timer`]);
    expect(res).toBe("plugin @bob/timer installed");
    expect(existsSync(join(cwd.dir, "plugins/@bob__timer/timer.js"))).toBe(
      true,
    );
    expect(existsSync(join(cwd.dir, "plugins/@bob__timer/timer"))).toBe(false);
    expect(existsSync(join(cwd.dir, "plugins/@bob__timer/link.tgz"))).toBe(
      false,
    );
  });

  it("rewrites the asset paths of plugin.json to the installed name", async () => {
    const tarball = await makeTarball("timer", {
      "plugin.json": JSON.stringify({
        addStyles: ["plugins/timer/timer.css"],
        addScripts: ["plugins/timer/timer.js"],
        addSpeakerStyles: ["plugins/timer/speaker.css"],
        addSpeakerScripts: ["plugins/timer/speaker.js"],
        addWS: "plugins/timer/ws.js",
      }),
    });
    stubFetch(async () => new Response(tarball));
    await pluginInstall("bob__timer", LINK);
    const json = await Bun.file(
      join(cwd.dir, "plugins/bob__timer/plugin.json"),
    ).json();
    expect(json.addStyles).toEqual(["plugins/bob__timer/timer.css"]);
    expect(json.addScripts).toEqual(["plugins/bob__timer/timer.js"]);
    expect(json.addSpeakerStyles).toEqual(["plugins/bob__timer/speaker.css"]);
    expect(json.addSpeakerScripts).toEqual(["plugins/bob__timer/speaker.js"]);
    expect(json.addWS).toBe("plugins/bob__timer/ws.js");
  });

  it("leaves a plugin.json without asset lists alone", async () => {
    const tarball = await makeTarball("timer", {
      "plugin.json": '{"name":"timer"}',
    });
    stubFetch(async () => new Response(tarball));
    await pluginInstall("bob__timer", LINK);
    const json = await Bun.file(
      join(cwd.dir, "plugins/bob__timer/plugin.json"),
    ).json();
    expect(json).toEqual({ name: "timer" });
  });

  it("installs into an explicit target directory", async () => {
    const tarball = await makeTarball("timer", { "plugin.json": "{}" });
    stubFetch(async () => new Response(tarball));
    const target = join(cwd.dir, "elsewhere");
    await pluginInstall("bob__timer", LINK, false, target);
    expect(existsSync(join(target, "plugins/bob__timer/plugin.json"))).toBe(
      true,
    );
  });

  it("reports an update rather than an install", async () => {
    const tarball = await makeTarball("timer", { "plugin.json": "{}" });
    stubFetch(async () => new Response(tarball));
    expect(await pluginInstall("bob__timer", LINK, true)).toBe(
      "plugin bob/timer updated",
    );
  });

  it("reports a plugin missing from the hub", async () => {
    stubFetch(async () => new Response("", { status: 404 }));
    await expect(pluginInstall("bob__ghost", LINK)).rejects.toThrow(
      "plugin bob/ghost not found",
    );
  });
});

describe("pluginRemove", () => {
  it("refuses an empty name", async () => {
    await expect(pluginRemove("")).rejects.toThrow(
      "Please provide the name of an installed plugin",
    );
  });

  it("reports a plugin that is not installed", async () => {
    await expect(pluginRemove("ghost")).rejects.toThrow(
      "plugin ghost not found",
    );
  });

  it("deletes an installed plugin", async () => {
    installedPlugin("timer");
    expect(await pluginRemove("timer")).toBe("plugin timer removed");
    expect(existsSync(join(cwd.dir, "plugins/timer"))).toBe(false);
  });
});

describe("plugin command", () => {
  it("exposes the five subcommands", () => {
    expect(pluginCmd.name).toBe("plugin");
    const help = pluginCmd.helpText();
    for (const sub of ["install", "remove", "update", "search", "push"])
      expect(help).toContain(sub);
  });

  it("installs through the install subcommand", async () => {
    const tarball = await makeTarball("timer", { "plugin.json": "{}" });
    stubFetch(async () => new Response(tarball));
    expect(
      await run(["install", "bob/timer", "--slidesk-link-url", LINK]),
    ).toBe(0);
    expect(captured.log()).toContain("installed");
  });

  it("removes through the remove subcommand", async () => {
    installedPlugin("timer");
    expect(await run(["remove", "timer"])).toBe(0);
    expect(captured.log()).toContain("removed");
  });

  it("reinstalls through the update subcommand", async () => {
    const tarball = await makeTarball("timer", { "plugin.json": "{}" });
    stubFetch(async () => new Response(tarball));
    installedPlugin("bob__timer");
    expect(
      await run(["update", "bob__timer", "--slidesk-link-url", LINK]),
    ).toBe(0);
    expect(captured.log()).toContain("updated");
    expect(existsSync(join(cwd.dir, "plugins/bob__timer/plugin.json"))).toBe(
      true,
    );
  });

  it("installs the plugins picked in the search results", async () => {
    const tarball = await makeTarball("timer", { "plugin.json": "{}" });
    selection = ["bob__timer"];
    const urls = stubFetch(async (url) =>
      url.includes("/search/")
        ? Response.json(["bob/timer"])
        : new Response(tarball),
    );
    expect(await run(["search", "tim", "--slidesk-link-url", LINK])).toBe(0);
    expect(urls[0]).toBe(`${LINK}/addons/search/plugin/tim`);
    expect(urls[1]).toBe(`${LINK}/addons/download/plugin/bob/timer`);
  });

  it("exits when the search finds nothing", async () => {
    stubFetch(async () => new Response("", { status: 404 }));
    expect(await run(["search", "nope", "--slidesk-link-url", LINK])).toBe(1);
    expect(captured.error()).toContain("No plugin with this name is found");
  });

  it("exits when the search term is missing", async () => {
    expect(await run(["search"])).toBe(1);
    expect(captured.error()).toContain("Please provide a search term");
  });

  it("pushes a plugin with its manifest and readme", async () => {
    mkdirSync(join(cwd.dir, "mine"), { recursive: true });
    writeFileSync(join(cwd.dir, "mine/plugin.json"), '{"name":"mine"}');
    writeFileSync(join(cwd.dir, "mine/README.md"), "# Mine");
    const urls = stubFetch(async () => new Response("", { status: 201 }));
    expect(await run(["push", "mine", "--slidesk-link-url", LINK])).toBe(0);
    expect(urls).toEqual([`${LINK}/addons`]);
    expect(captured.log()).toContain("added or updated into the hub");
    expect(existsSync(join(cwd.dir, "link.tgz"))).toBe(false);
  });

  it("pushes a plugin that has no readme", async () => {
    mkdirSync(join(cwd.dir, "bare"), { recursive: true });
    writeFileSync(join(cwd.dir, "bare/plugin.json"), "{}");
    stubFetch(async () => new Response("", { status: 201 }));
    expect(await run(["push", "bare", "--slidesk-link-url", LINK])).toBe(0);
    expect(captured.log()).toContain("added or updated into the hub");
  });

  it("refuses to push a directory without a plugin.json", async () => {
    mkdirSync(join(cwd.dir, "nomanifest"), { recursive: true });
    expect(await run(["push", "nomanifest", "--slidesk-link-url", LINK])).toBe(
      1,
    );
    expect(captured.error()).toContain("plugin.json is missing");
  });

  it("reports a rejected push", async () => {
    mkdirSync(join(cwd.dir, "mine"), { recursive: true });
    writeFileSync(join(cwd.dir, "mine/plugin.json"), "{}");
    stubFetch(async () => new Response("nope", { status: 400 }));
    expect(await run(["push", "mine", "--slidesk-link-url", LINK])).toBe(1);
    expect(captured.error()).toContain("nope");
  });

  it("exits when the push has no plugin name", async () => {
    expect(await run(["push"])).toBe(1);
    expect(captured.error()).toContain("Please provide a plugin name");
  });
});

describe("addon safety", () => {
  it("reports a hub failure instead of extracting the error page", async () => {
    stubFetch(async () => new Response("oops", { status: 503 }));
    await expect(pluginInstall("bob__timer", LINK)).rejects.toThrow(
      "plugin bob/timer could not be downloaded (503)",
    );
  });

  it("keeps the installed plugin when the update cannot be downloaded", async () => {
    installedPlugin("bob__timer");
    stubFetch(async () => new Response("", { status: 503 }));
    expect(await run(["update", "bob/timer", "--slidesk-link-url", LINK])).toBe(
      1,
    );
    expect(existsSync(join(cwd.dir, "plugins/bob__timer/plugin.json"))).toBe(
      true,
    );
  });

  it("refuses names that escape the plugins directory", async () => {
    const urls = stubFetch(async () => new Response(""));
    await expect(pluginInstall("bob__../../evil", LINK)).rejects.toThrow(
      "Please provide a plugin name",
    );
    await expect(pluginRemove("..")).rejects.toThrow(
      "Please provide the name of an installed plugin",
    );
    expect(urls).toEqual([]);
  });
});
