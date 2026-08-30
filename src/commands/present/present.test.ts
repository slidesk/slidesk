import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import { cpSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ExitError, useTempCwd } from "../../__testing__/addons";
import { captured } from "../../__testing__/console";

// getAction would sit on stdin waiting for a keypress
mock.module("../../utils/interactCLI", () => ({
  question: async () => "",
  removeCurrentLine: () => {},
  getAction: async () => {},
}));

const exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new ExitError(code);
}) as never);

const { default: presentCmd } = await import("./index");

const FIXTURE = join(import.meta.dir, "../../__fixtures__/talk");

/** The server binds the configured port and is never stopped, so each test takes a free one. */
const freePort = () => {
  const probe = Bun.serve({ port: 0, fetch: () => new Response("") });
  const { port } = probe;
  probe.stop(true);
  return port;
};

let cwd: ReturnType<typeof useTempCwd>;
const listeners = process.listeners("SIGINT").length;

/** Writes a conf next to the talk and returns the argv to serve it. */
const talkOn = (port: number, extra = "") => {
  const conf = `port-${port}.toml`;
  writeFileSync(
    join(cwd.dir, "my-talk", conf),
    `[slidesk]\nPORT = ${port}\nTRANSITION = 0\n${extra}\n`,
  );
  return ["my-talk", "--conf", conf];
};

const waitForServer = async (port: number) => {
  for (let i = 0; i < 200; i += 1) {
    try {
      return await fetch(`http://127.0.0.1:${port}/`);
    } catch {
      await Bun.sleep(10);
    }
  }
  throw new Error(`nothing answered on port ${port}`);
};

beforeEach(() => {
  captured.clear();
  exitSpy.mockClear();
  cwd = useTempCwd();
  cpSync(FIXTURE, join(cwd.dir, "my-talk"), { recursive: true });
});

afterEach(() => {
  cwd.restore();
});

describe("present command", () => {
  it("serves the talk on the configured port", async () => {
    const port = freePort();
    await presentCmd.ready(talkOn(port, "WATCH = false"));
    const res = await waitForServer(port);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Welcome");
  });

  it("prints the keyboard help", async () => {
    const port = freePort();
    await presentCmd.ready(talkOn(port, "WATCH = false"));
    await waitForServer(port);
    expect(captured.log()).toContain("Take the control of your presentation");
    expect(captured.log()).toContain("Press \x1b[1mEnter\x1b[0m");
  });

  it("hides the keyboard help when asked", async () => {
    const port = freePort();
    await presentCmd.ready([...talkOn(port, "WATCH = false"), "--hidden"]);
    await waitForServer(port);
    expect(captured.log()).not.toContain(
      "Take the control of your presentation",
    );
  });

  it("rebuilds the presentation when a slide changes", async () => {
    const port = freePort();
    await presentCmd.ready(talkOn(port));
    await waitForServer(port);
    writeFileSync(
      join(cwd.dir, "my-talk/slides/01-intro.sdf"),
      "## Intro\n\nRewritten body\n",
    );
    for (let i = 0; i < 200; i += 1) {
      if (
        (await (await fetch(`http://127.0.0.1:${port}/`)).text()).includes(
          "Rewritten body",
        )
      )
        break;
      await Bun.sleep(10);
    }
    const html = await (await fetch(`http://127.0.0.1:${port}/`)).text();
    expect(html).toContain("Rewritten body");
    expect(captured.log()).toContain("action");
  });

  it("does not watch the talk when WATCH is disabled", async () => {
    const port = freePort();
    await presentCmd.ready(talkOn(port, "WATCH = false"));
    await waitForServer(port);
    writeFileSync(
      join(cwd.dir, "my-talk/slides/01-intro.sdf"),
      "## Intro\n\nIgnored body\n",
    );
    await Bun.sleep(150);
    const html = await (await fetch(`http://127.0.0.1:${port}/`)).text();
    expect(html).not.toContain("Ignored body");
  });

  it("also serves a telnet version when asked", async () => {
    const port = freePort();
    const telnetPort = freePort();
    await presentCmd.ready([
      ...talkOn(port, `WATCH = false\nTELNET_PORT = ${telnetPort}`),
      "--telnet",
    ]);
    await waitForServer(port);
    for (let i = 0; i < 200; i += 1) {
      if (captured.log().includes("[telnet]")) break;
      await Bun.sleep(10);
    }
    expect(captured.log()).toContain(
      `[telnet] Server started on port ${telnetPort}`,
    );
  });

  it("announces the presentation on a routable address", async () => {
    const port = freePort();
    await presentCmd.ready(talkOn(port, "WATCH = false"));
    await waitForServer(port);
    expect(captured.log()).toContain(`http://localhost:${port}`);
    expect(captured.log()).toMatch(
      new RegExp(`available on: .*http://[\\d.]+:${port}`),
    );
  });

  it("quits on SIGINT", async () => {
    const port = freePort();
    await presentCmd.ready(talkOn(port, "WATCH = false"));
    await waitForServer(port);
    expect(process.listeners("SIGINT").length).toBeGreaterThan(listeners);
    const handler = process.listeners("SIGINT").at(-1) as () => void;
    expect(() => handler()).toThrow("process.exit(0)");
  });

  it("documents its options", () => {
    const help = presentCmd.helpText();
    for (const option of [
      "--notes",
      "--hidden",
      "--conf",
      "--open",
      "--lang",
      "--telnet",
    ])
      expect(help).toContain(option);
  });
});
