import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { captured } from "../__testing__/console";
import { startTelnetServer } from "./TCPServer";
import { ANSI } from "./tcpserver/ansi";

const SLIDES = `<html><body>
<section class="sd-slide" data-num="0"><h2>First</h2><p>one</p></section>
<section class="sd-slide" data-num="1"><h2>Second</h2><p>two</p></section>
<section class="sd-slide" data-num="2"><h2>Third</h2><p>three</p></section>
</body></html>`;

/** The telnet server binds its port and never releases it, so each test takes a free one. */
const freePort = () => {
  const probe = Bun.serve({ port: 0, fetch: () => new Response("") });
  const { port } = probe;
  probe.stop(true);
  return port;
};

const slideServer = Bun.serve({
  port: 0,
  fetch: () =>
    new Response(SLIDES, { headers: { "Content-Type": "text/html" } }),
});

afterAll(() => {
  slideServer.stop(true);
});

const start = async (extra: Record<string, unknown> = {}) => {
  const telnetPort = freePort();
  await startTelnetServer(
    { ip: "127.0.0.1" },
    { slidesk: { PORT: slideServer.port, TELNET_PORT: telnetPort, ...extra } },
  );
  return telnetPort;
};

const connect = async (port: number) => {
  let buffer = "";
  // the negotiation is binary, so the raw bytes are kept next to the decoded text
  const bytes: number[] = [];
  const socket = await Bun.connect({
    hostname: "127.0.0.1",
    port,
    socket: {
      data(_socket, data) {
        buffer += data.toString("utf8");
        bytes.push(...data);
      },
      open() {},
    },
  });
  const waitFor = async (needle: string) => {
    for (let i = 0; i < 200; i += 1) {
      if (buffer.includes(needle)) return true;
      await Bun.sleep(10);
    }
    return false;
  };
  return {
    socket,
    output: () => buffer,
    bytes: () => bytes,
    clear: () => {
      buffer = "";
    },
    waitFor,
    send: (data: Buffer | string) => socket.write(data),
    close: () => socket.end(),
  };
};

beforeEach(() => {
  captured.clear();
});

describe("startTelnetServer", () => {
  it("listens on the configured telnet port", async () => {
    const port = await start();
    const client = await connect(port);
    expect(await client.waitFor("SliDesk")).toBe(true);
    client.close();
  });

  it("announces the port it is actually listening on", async () => {
    const port = await start();
    expect(captured.log()).toContain(`[telnet] Server started on port ${port}`);
    expect(captured.log()).toContain(`telnet 127.0.0.1 ${port}`);
    expect(captured.log()).toContain(`telnet localhost ${port}`);
  });

  it("announces the configured domain", async () => {
    const port = await start({ DOMAIN: "talk.dev" });
    expect(captured.log()).toContain(`telnet talk.dev ${port}`);
  });

  it("greets a new connection with the banner and the char mode negotiation", async () => {
    const port = await start();
    const client = await connect(port);
    await client.waitFor("Press any key to start...");
    const out = client.output();
    expect(out).toContain("SliDesk");
    expect(out).toContain("Navigate between slides");
    // IAC WILL SGA, IAC WILL ECHO: the telnet negotiation comes first
    expect(client.bytes().slice(0, 6)).toEqual([255, 251, 3, 255, 251, 1]);
    client.close();
  });

  it("renders the first slide on the first keypress", async () => {
    const port = await start();
    const client = await connect(port);
    await client.waitFor("Press any key to start...");
    client.clear();
    client.send(" ");
    // the status bar is drawn last, so it marks the end of a render
    expect(await client.waitFor("Slide 1 / 3")).toBe(true);
    expect(client.output()).toContain("First");
    client.close();
  });

  it("navigates to the next slide", async () => {
    const port = await start();
    const client = await connect(port);
    await client.waitFor("Press any key to start...");
    client.send(" ");
    await client.waitFor("Slide 1 / 3");
    client.clear();
    client.send("\x1b[C");
    expect(await client.waitFor("Slide 2 / 3")).toBe(true);
    expect(client.output()).toContain("Second");
    client.close();
  });

  it("jumps to a slide by its number", async () => {
    const port = await start();
    const client = await connect(port);
    await client.waitFor("Press any key to start...");
    client.send(" ");
    await client.waitFor("Slide 1 / 3");
    client.clear();
    client.send("3");
    expect(await client.waitFor("Slide 3 / 3")).toBe(true);
    expect(client.output()).toContain("Third");
    client.close();
  });

  it("redraws using the size the client negotiates", async () => {
    const port = await start();
    const client = await connect(port);
    await client.waitFor("Press any key to start...");
    client.send(" ");
    await client.waitFor("Slide 1 / 3");
    client.clear();
    // IAC SB NAWS 100x30 IAC SE
    client.send(Buffer.from([255, 250, 31, 0, 100, 0, 30, 255, 240]));
    expect(await client.waitFor(ANSI.moveTo(30, 1))).toBe(true);
    client.close();
  });

  it("ignores a resize received before the presentation started", async () => {
    const port = await start();
    const client = await connect(port);
    await client.waitFor("Press any key to start...");
    client.clear();
    client.send(Buffer.from([255, 250, 31, 0, 100, 0, 30, 255, 240]));
    await Bun.sleep(60);
    expect(client.output()).toBe("");
    client.close();
  });
});
