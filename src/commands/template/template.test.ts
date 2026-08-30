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
const { templateInstall } = await import("./install");
const { templateRemove } = await import("./remove");
const { default: templateCmd } = await import("./index");

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
    await templateCmd.ready(argv);
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
    return e.code;
  }
  return undefined;
};

const installedTemplate = (name: string) => {
  mkdirSync(join(cwd.dir, "templates", name), { recursive: true });
  writeFileSync(join(cwd.dir, "templates", name, "template.json"), "{}");
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

describe("templateInstall", () => {
  it("refuses an empty name", async () => {
    expect(await templateInstall("")).toBe(
      "Please provide a name for the template",
    );
  });

  it("downloads a template and flattens it into its own directory", async () => {
    const tarball = await makeTarball("cover", {
      "cover.sdt": "<div><sd-title /></div>",
    });
    const urls = stubFetch(async () => new Response(tarball));
    const res = await templateInstall("@bob__cover", LINK);
    expect(urls).toEqual([`${LINK}/addons/download/template/bob/cover`]);
    expect(res).toBe("template @bob/cover installed");
    expect(existsSync(join(cwd.dir, "templates/@bob__cover/cover.sdt"))).toBe(
      true,
    );
    expect(existsSync(join(cwd.dir, "templates/@bob__cover/cover"))).toBe(
      false,
    );
  });

  it("installs into an explicit target directory", async () => {
    const tarball = await makeTarball("cover", { "cover.sdt": "x" });
    stubFetch(async () => new Response(tarball));
    const target = join(cwd.dir, "elsewhere");
    await templateInstall("bob__cover", LINK, false, target);
    expect(existsSync(join(target, "templates/bob__cover/cover.sdt"))).toBe(
      true,
    );
  });

  it("reports an update rather than an install", async () => {
    const tarball = await makeTarball("cover", { "cover.sdt": "x" });
    stubFetch(async () => new Response(tarball));
    expect(await templateInstall("bob__cover", LINK, true)).toBe(
      "template bob/cover updated",
    );
  });

  it("reports a template missing from the hub", async () => {
    stubFetch(async () => new Response("", { status: 404 }));
    expect(await templateInstall("bob__ghost", LINK)).toBe("");
    expect(captured.error()).toContain("template bob/ghost not found");
  });
});

describe("templateRemove", () => {
  it("refuses an empty name", async () => {
    expect(await templateRemove("")).toBe(
      "Please provide a name for the template",
    );
  });

  it("reports a template that is not installed", async () => {
    expect(await templateRemove("ghost")).toBe("template not found");
  });

  it("deletes an installed template", async () => {
    installedTemplate("cover");
    expect(await templateRemove("cover")).toBe("template cover removed");
    expect(existsSync(join(cwd.dir, "templates/cover"))).toBe(false);
  });
});

describe("template command", () => {
  it("exposes the five subcommands", () => {
    expect(templateCmd.name).toBe("template");
    const help = templateCmd.helpText();
    for (const sub of ["install", "remove", "update", "search", "push"])
      expect(help).toContain(sub);
  });

  it("installs through the install subcommand", async () => {
    const tarball = await makeTarball("cover", { "cover.sdt": "x" });
    stubFetch(async () => new Response(tarball));
    expect(
      await run(["install", "bob/cover", "--slidesk-link-url", LINK]),
    ).toBe(0);
    expect(captured.log()).toContain("installed");
  });

  it("removes through the remove subcommand", async () => {
    installedTemplate("cover");
    expect(await run(["remove", "cover"])).toBe(0);
    expect(captured.log()).toContain("removed");
  });

  it("reinstalls through the update subcommand", async () => {
    const tarball = await makeTarball("cover", { "cover.sdt": "x" });
    stubFetch(async () => new Response(tarball));
    installedTemplate("bob__cover");
    expect(
      await run(["update", "bob__cover", "--slidesk-link-url", LINK]),
    ).toBe(0);
    expect(captured.log()).toContain("updated");
    expect(existsSync(join(cwd.dir, "templates/bob__cover/cover.sdt"))).toBe(
      true,
    );
  });

  it("installs the templates picked in the search results", async () => {
    const tarball = await makeTarball("cover", { "cover.sdt": "x" });
    selection = ["bob__cover"];
    const urls = stubFetch(async (url) =>
      url.includes("/search/")
        ? Response.json(["bob/cover"])
        : new Response(tarball),
    );
    expect(await run(["search", "cov", "--slidesk-link-url", LINK])).toBe(0);
    expect(urls[0]).toBe(`${LINK}/addons/search/template/cov`);
    expect(urls[1]).toBe(`${LINK}/addons/download/template/bob/cover`);
  });

  it("exits when the search finds nothing", async () => {
    stubFetch(async () => new Response("", { status: 404 }));
    expect(await run(["search", "nope", "--slidesk-link-url", LINK])).toBe(1);
    expect(captured.error()).toContain("No template with this name is found");
  });

  it("exits when the search term is missing", async () => {
    expect(await run(["search"])).toBe(1);
    expect(captured.error()).toContain("Please provide a search term");
  });

  it("pushes a template with its readme", async () => {
    mkdirSync(join(cwd.dir, "mine"), { recursive: true });
    writeFileSync(join(cwd.dir, "mine/mine.sdt"), "x");
    writeFileSync(join(cwd.dir, "mine/README.md"), "# Mine");
    const urls = stubFetch(async () => new Response("", { status: 201 }));
    expect(await run(["push", "mine", "--slidesk-link-url", LINK])).toBe(0);
    expect(urls).toEqual([`${LINK}/addons`]);
    expect(captured.log()).toContain("added or updated into the hub");
    expect(existsSync(join(cwd.dir, "link.tgz"))).toBe(false);
  });

  it("pushes a template that has no readme", async () => {
    mkdirSync(join(cwd.dir, "bare"), { recursive: true });
    writeFileSync(join(cwd.dir, "bare/bare.sdt"), "x");
    stubFetch(async () => new Response("", { status: 201 }));
    expect(await run(["push", "bare", "--slidesk-link-url", LINK])).toBe(0);
    expect(captured.log()).toContain("added or updated into the hub");
  });

  it("reports a rejected push", async () => {
    mkdirSync(join(cwd.dir, "mine"), { recursive: true });
    writeFileSync(join(cwd.dir, "mine/mine.sdt"), "x");
    stubFetch(async () => new Response("nope", { status: 400 }));
    expect(await run(["push", "mine", "--slidesk-link-url", LINK])).toBe(0);
    expect(captured.error()).toContain("nope");
  });

  it("exits when the push has no template name", async () => {
    expect(await run(["push"])).toBe(1);
    expect(captured.error()).toContain("Please provide a template name");
  });
});
