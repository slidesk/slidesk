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
mock.module("@clack/prompts", () => ({
  multiselect: async () => selection,
}));
mock.module("../../utils/getLinkToken", () => ({
  default: async () => "a-token",
}));

// These modules destructure `console` at import time and nothing else in the
// suite imports them, so the spies above are already in place.
const { componentInstall } = await import("./install");
const { componentRemove } = await import("./remove");
const { default: componentCmd } = await import("./index");

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

/** Runs a subcommand the way the CLI does, swallowing the exit it ends with. */
const run = async (argv: string[]) => {
  try {
    await componentCmd.ready(argv);
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
    return e.code;
  }
  return undefined;
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

describe("componentInstall", () => {
  it("refuses an empty name", async () => {
    expect(await componentInstall("")).toBe(
      "Please provide a name for the component",
    );
  });

  it("downloads the component of a user and extracts it", async () => {
    const tarball = await makeTarball("hello", {
      "hello.mjs": "export default (c) => c;",
    });
    const urls = stubFetch(async () => new Response(tarball));
    const res = await componentInstall("@bob__hello", LINK);
    expect(urls).toEqual([`${LINK}/addons/download/component/bob/hello`]);
    expect(res).toBe("component @bob/hello installed");
    expect(existsSync(join(cwd.dir, "components/hello/hello.mjs"))).toBe(true);
    expect(existsSync(join(cwd.dir, "components/link.tgz"))).toBe(false);
  });

  it("reports an update rather than an install", async () => {
    const tarball = await makeTarball("hello", { "hello.mjs": "x" });
    stubFetch(async () => new Response(tarball));
    expect(await componentInstall("bob__hello", LINK, true)).toBe(
      "component bob/hello updated",
    );
  });

  it("reports a component missing from the hub", async () => {
    stubFetch(async () => new Response("", { status: 404 }));
    expect(await componentInstall("bob__ghost", LINK)).toBe("");
    expect(captured.error()).toContain("Component bob/ghost not found");
  });

  it("strips escaped unicode from the name", async () => {
    const tarball = await makeTarball("hello", { "hello.mjs": "x" });
    const urls = stubFetch(async () => new Response(tarball));
    await componentInstall("bob__hello\\u0041", LINK);
    expect(urls[0]).toBe(`${LINK}/addons/download/component/bob/hello`);
  });
});

describe("componentRemove", () => {
  it("refuses an empty name", async () => {
    expect(await componentRemove("")).toBe(
      "Please provide a name for the component",
    );
  });

  it("reports a component that is not installed", async () => {
    expect(await componentRemove("ghost")).toBe("Component not found");
  });

  it("deletes an installed component", async () => {
    mkdirSync(join(cwd.dir, "components"), { recursive: true });
    writeFileSync(join(cwd.dir, "components/hello.mjs"), "x");
    expect(await componentRemove("hello")).toBe("Component hello removed");
    expect(existsSync(join(cwd.dir, "components/hello.mjs"))).toBe(false);
  });
});

describe("component command", () => {
  it("exposes the five subcommands", () => {
    expect(componentCmd.name).toBe("component");
    const help = componentCmd.helpText();
    for (const sub of ["install", "remove", "update", "search", "push"])
      expect(help).toContain(sub);
  });

  it("installs through the install subcommand", async () => {
    const tarball = await makeTarball("hello", { "hello.mjs": "x" });
    stubFetch(async () => new Response(tarball));
    expect(
      await run(["install", "bob/hello", "--slidesk-link-url", LINK]),
    ).toBe(0);
    expect(captured.log()).toContain("installed");
  });

  it("removes through the remove subcommand", async () => {
    mkdirSync(join(cwd.dir, "components"), { recursive: true });
    writeFileSync(join(cwd.dir, "components/hello.mjs"), "x");
    expect(await run(["remove", "hello"])).toBe(0);
    expect(captured.log()).toContain("removed");
  });

  it("reinstalls through the update subcommand", async () => {
    const tarball = await makeTarball("bob__hello", { "hello.mjs": "new" });
    stubFetch(async () => new Response(tarball));
    mkdirSync(join(cwd.dir, "components"), { recursive: true });
    writeFileSync(join(cwd.dir, "components/hello.mjs"), "old");
    expect(
      await run(["update", "bob__hello", "--slidesk-link-url", LINK]),
    ).toBe(0);
    expect(captured.log()).toContain("updated");
    // the install has to complete before the command exits
    expect(existsSync(join(cwd.dir, "components/bob__hello/hello.mjs"))).toBe(
      true,
    );
  });

  it("installs the components picked in the search results", async () => {
    const tarball = await makeTarball("hello", { "hello.mjs": "x" });
    selection = ["bob__hello"];
    const urls = stubFetch(async (url) =>
      url.includes("/search/")
        ? Response.json(["bob/hello"])
        : new Response(tarball),
    );
    expect(await run(["search", "hell", "--slidesk-link-url", LINK])).toBe(0);
    expect(urls[0]).toBe(`${LINK}/addons/search/component/hell`);
    expect(urls[1]).toBe(`${LINK}/addons/download/component/bob/hello`);
  });

  it("exits when the search finds nothing", async () => {
    stubFetch(async () => new Response("", { status: 404 }));
    expect(await run(["search", "nope", "--slidesk-link-url", LINK])).toBe(1);
    expect(captured.error()).toContain("No component with this name is found");
  });

  it("exits when the search term is missing", async () => {
    expect(await run(["search"])).toBe(1);
    expect(captured.error()).toContain("Please provide a search term");
  });

  it("pushes a component to the hub", async () => {
    writeFileSync(join(cwd.dir, "mine.mjs"), "export default 1;");
    const urls = stubFetch(async () => new Response("", { status: 201 }));
    expect(await run(["push", "mine", "--slidesk-link-url", LINK])).toBe(0);
    expect(urls).toEqual([`${LINK}/addons`]);
    expect(captured.log()).toContain("added or updated into the hub");
    expect(existsSync(join(cwd.dir, "link.tgz"))).toBe(false);
  });

  it("reports a rejected push", async () => {
    writeFileSync(join(cwd.dir, "mine.mjs"), "export default 1;");
    stubFetch(async () => new Response("nope", { status: 400 }));
    expect(await run(["push", "mine", "--slidesk-link-url", LINK])).toBe(0);
    expect(captured.error()).toContain("nope");
  });

  it("exits when the push has no component name", async () => {
    expect(await run(["push"])).toBe(1);
    expect(captured.error()).toContain("Please provide a component name");
  });
});
