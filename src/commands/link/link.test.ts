import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import { cpSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ExitError,
  recordingFetch,
  useTempCwd,
} from "../../__testing__/addons";
import { captured } from "../../__testing__/console";
import { runCommand } from "../../utils/cliError";

const savedTokens: string[] = [];
mock.module("../../utils/getLinkToken", () => ({
  default: async () => "a-token",
  saveLinkToken: async (token: string) => {
    savedTokens.push(token);
  },
}));

const exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new ExitError(code);
}) as never);

const { default: linkCmd } = await import("./index");

const LINK = "https://link.test";
const FIXTURE = join(import.meta.dir, "../../__fixtures__/talk");
// host resolves the talk against process.cwd(), so the fixture is copied in
const talk = "my-talk";

let cwd: ReturnType<typeof useTempCwd>;
const spies: ReturnType<typeof spyOn>[] = [];

const stubFetch = (
  responder: (url: string) => Response | Promise<Response>,
) => {
  const { urls, impl } = recordingFetch(responder);
  spies.push(spyOn(globalThis, "fetch").mockImplementation(impl as never));
  return urls;
};

const run = async (argv: string[]) => {
  try {
    return await runCommand(() => linkCmd.ready(argv));
  } catch (e) {
    if (!(e instanceof ExitError)) throw e;
    return e.code;
  }
};

beforeEach(() => {
  captured.clear();
  exitSpy.mockClear();
  cwd = useTempCwd();
  cpSync(FIXTURE, join(cwd.dir, talk), { recursive: true });
});

afterEach(() => {
  for (const spy of spies.splice(0)) spy.mockRestore();
  cwd.restore();
});

describe("link command", () => {
  it("exposes its three subcommands", () => {
    expect(linkCmd.name).toBe("link");
    const help = linkCmd.helpText();
    for (const sub of ["host", "login", "push"]) expect(help).toContain(sub);
  });
});

describe("link push", () => {
  it("uploads link.yml and confirms", async () => {
    writeFileSync(join(cwd.dir, "link.yml"), "title: my talk");
    const urls = stubFetch(async () => new Response("", { status: 201 }));
    expect(await run(["push", "--slidesk-link-url", LINK])).toBe(0);
    expect(urls).toEqual([`${LINK}/pushtotalk`]);
    expect(captured.log()).toContain("added to your page");
  });

  it("exits when there is no link.yml", async () => {
    expect(await run(["push", "--slidesk-link-url", LINK])).toBe(1);
    expect(captured.error()).toContain("link.yml not found");
  });

  it("reports a rejected upload", async () => {
    writeFileSync(join(cwd.dir, "link.yml"), "title: my talk");
    stubFetch(async () => new Response("quota exceeded", { status: 400 }));
    expect(await run(["push", "--slidesk-link-url", LINK])).toBe(1);
    expect(captured.error()).toContain("quota exceeded");
  });
});

describe("link host", () => {
  it("packs the talk, uploads it and prints the public url", async () => {
    const urls = stubFetch(async () => new Response("abc123"));
    expect(await run(["host", talk, "--slidesk-link-url", LINK])).toBe(0);
    expect(urls).toEqual([`${LINK}/upload`]);
    expect(captured.log()).toContain("available for 72h");
    expect(captured.log()).toContain(`${LINK}/s/abc123/`);
  });

  it("uploads a speaker token and keeps it out of the public url", async () => {
    let sent: FormDataEntryValue | null = null;
    spies.push(
      spyOn(globalThis, "fetch").mockImplementation((async (
        _: string,
        init: RequestInit,
      ) => {
        sent = (init.body as FormData).get("token");
        return new Response("abc123");
      }) as never),
    );
    await run(["host", talk, "--slidesk-link-url", LINK]);
    expect(typeof sent).toBe("string");
    expect(captured.logs).toContain(
      `Share with your audience: ${LINK}/s/abc123/`,
    );
    expect(captured.log()).toContain(`${LINK}/s/abc123/?token=${sent}`);
    expect(captured.log()).toContain(
      `${LINK}/s/abc123/notes.html?token=${sent}`,
    );
  });

  it("cleans up the staging directory and the tarball", async () => {
    stubFetch(async () => new Response("abc123"));
    await run(["host", talk, "--slidesk-link-url", LINK]);
    expect(existsSync(join(cwd.dir, "__SLIDESKLINK__"))).toBe(false);
    expect(existsSync(join(cwd.dir, "link.tgz"))).toBe(false);
  });

  it("reports an error returned by the hub", async () => {
    stubFetch(async () => new Response("err:talk too large"));
    expect(await run(["host", talk, "--slidesk-link-url", LINK])).toBe(1);
    expect(captured.error()).toContain("err:talk too large");
  });

  it("reports a failing hub instead of printing its error page", async () => {
    stubFetch(async () => new Response("<html>oops", { status: 502 }));
    expect(await run(["host", talk, "--slidesk-link-url", LINK])).toBe(1);
    expect(captured.error()).toContain("Hosting failed (502)");
    expect(captured.log()).not.toContain("available for 72h");
  });

  it("leaves a link.tgz of the user alone", async () => {
    writeFileSync(join(cwd.dir, "link.tgz"), "mine");
    stubFetch(async () => new Response("abc123"));
    await run(["host", talk, "--slidesk-link-url", LINK]);
    expect(await Bun.file(join(cwd.dir, "link.tgz")).text()).toBe("mine");
  });

  it("documents its options", () => {
    const help = linkCmd.helpText();
    expect(help).toContain("host");
  });
});

describe("link login", () => {
  // login reads ~/.slidesk and binds a local port, so Bun's file, server and
  // spawn entry points are stubbed for the whole block
  let stopped = 0;
  let served: {
    port: number;
    routes: Record<string, CallableFunction>;
  } | null = null;
  let spawned: string[][] = [];

  const stubBun = (
    token: { exists: boolean; size: number },
    busy: number[] = [],
  ) => {
    savedTokens.length = 0;
    stopped = 0;
    served = null;
    spawned = [];
    spies.push(
      spyOn(Bun, "file").mockImplementation(((path: string) => ({
        path,
        size: token.size,
        exists: async () => token.exists,
      })) as never),
      spyOn(Bun, "serve").mockImplementation(((options: {
        port: number;
        routes: Record<string, CallableFunction>;
      }) => {
        if (busy.includes(options.port)) throw new Error("EADDRINUSE");
        served = options;
        return {
          port: options.port || 4242,
          stop: () => {
            stopped += 1;
          },
        } as never;
      }) as never),
      spyOn(Bun, "spawn").mockImplementation(((cmd: string[]) => {
        spawned.push(cmd);
        return {} as never;
      }) as never),
    );
  };

  it("does nothing when a token is already stored", async () => {
    stubBun({ exists: true, size: 42 });
    expect(await run(["login", "--slidesk-link-url", LINK])).toBe(0);
    expect(savedTokens).toEqual([]);
    expect(served).toBeNull();
  });

  it("stores the token given on the command line", async () => {
    stubBun({ exists: false, size: 0 });
    expect(
      await run([
        "login",
        "--with-token",
        "tok-42",
        "--slidesk-link-url",
        LINK,
      ]),
    ).toBe(0);
    expect(savedTokens).toEqual(["tok-42"]);
  });

  it("refreshes an existing token when forced", async () => {
    stubBun({ exists: true, size: 42 });
    expect(
      await run([
        "login",
        "--force",
        "--with-token",
        "tok-99",
        "--slidesk-link-url",
        LINK,
      ]),
    ).toBe(0);
    expect(savedTokens).toEqual(["tok-99"]);
  });

  it("opens the browser on the hub authentication page", async () => {
    stubBun({ exists: false, size: 0 });
    await run(["login", "--slidesk-link-url", LINK]);
    expect(served).not.toBeNull();
    expect(spawned).toHaveLength(1);
    expect(spawned[0][1]).toBe(`${LINK}/auth?port=1337`);
  });

  it("falls back to a free port when 1337 is taken", async () => {
    stubBun({ exists: false, size: 0 }, [1337]);
    await run(["login", "--slidesk-link-url", LINK]);
    expect(served?.port).toBe(0);
    expect(spawned[0][1]).toBe(`${LINK}/auth?port=4242`);
  });

  it("stores the code the hub redirects back with", async () => {
    stubBun({ exists: false, size: 0 });
    await run(["login", "--slidesk-link-url", LINK]);
    const routes = served?.routes as Record<string, CallableFunction>;
    const res = await routes["/auth/:code"]({ params: { code: "from-hub" } });
    expect(savedTokens).toEqual(["from-hub"]);
    expect(await res.text()).toContain("You can close this tab");
  });

  it("stops its server when the browser tab reports it is done", async () => {
    stubBun({ exists: false, size: 0 });
    await run(["login", "--slidesk-link-url", LINK]);
    const routes = served?.routes as Record<string, CallableFunction>;
    routes["/close"]();
    expect(stopped).toBe(1);
  });
});
