import { describe, expect, it } from "bun:test";
import type { BunSocket, SliDeskTelnetSession } from "../../types";
import { handleInput } from "./input";

const fakeSocket = () => {
  const writes: string[] = [];
  let ended = false;
  let resolveEnd: () => void = () => {};
  const endedPromise = new Promise<void>((r) => {
    resolveEnd = r;
  });
  const socket = {
    write: (data: Buffer) => {
      writes.push(data.toString("utf8"));
      return data.length;
    },
    end: () => {
      ended = true;
      resolveEnd();
    },
  } as unknown as BunSocket;
  return { socket, writes, endedPromise, isEnded: () => ended };
};

const makeSession = (
  overrides: Partial<SliDeskTelnetSession> = {},
): SliDeskTelnetSession =>
  ({
    currentSlide: 0,
    totalSlides: 3,
    rows: 6,
    cols: 40,
    // keeps renderSlide a no-op so the assertions target the navigation state
    loading: true,
    started: true,
    config: { slides: ["<p>a</p>", "<p>b</p>", "<p>c</p>"] },
    ...overrides,
  }) as SliDeskTelnetSession;

describe("handleInput", () => {
  it("ignores telnet negotiation frames", () => {
    const { socket, writes } = fakeSocket();
    const session = makeSession();
    handleInput(socket, session, Buffer.from([255, 251, 3]));
    expect(session.currentSlide).toBe(0);
    expect(writes).toEqual([]);
  });

  it.each([["\x1b[C"], [" "], ["\r"], ["\r\n"]])(
    "moves to the next slide on %j",
    (key) => {
      const { socket } = fakeSocket();
      const session = makeSession();
      handleInput(socket, session, Buffer.from(key));
      expect(session.currentSlide).toBe(1);
    },
  );

  it("stays on the last slide", () => {
    const { socket } = fakeSocket();
    const session = makeSession({ currentSlide: 2 });
    handleInput(socket, session, Buffer.from(" "));
    expect(session.currentSlide).toBe(2);
  });

  it.each([["\x1b[D"], ["\x7f"], ["\x08"]])(
    "moves to the previous slide on %j",
    (key) => {
      const { socket } = fakeSocket();
      const session = makeSession({ currentSlide: 2 });
      handleInput(socket, session, Buffer.from(key));
      expect(session.currentSlide).toBe(1);
    },
  );

  it("stays on the first slide", () => {
    const { socket } = fakeSocket();
    const session = makeSession();
    handleInput(socket, session, Buffer.from("\x1b[D"));
    expect(session.currentSlide).toBe(0);
  });

  it("jumps to the slide matching the pressed digit", () => {
    const { socket } = fakeSocket();
    const session = makeSession();
    handleInput(socket, session, Buffer.from("3"));
    expect(session.currentSlide).toBe(2);
  });

  it("ignores a digit outside the deck", () => {
    const { socket } = fakeSocket();
    const session = makeSession({ currentSlide: 1 });
    handleInput(socket, session, Buffer.from("9"));
    expect(session.currentSlide).toBe(1);
  });

  it.each([["r"], ["R"]])("reloads the slide on %j", (key) => {
    const { socket } = fakeSocket();
    const session = makeSession({ currentSlide: 1 });
    handleInput(socket, session, Buffer.from(key));
    expect(session.currentSlide).toBe(1);
  });

  it("ignores an unknown key", () => {
    const { socket, writes } = fakeSocket();
    const session = makeSession();
    handleInput(socket, session, Buffer.from("z"));
    expect(session.currentSlide).toBe(0);
    expect(writes).toEqual([]);
  });

  it.each([["q"], ["Q"], ["\x03"]])(
    "says goodbye and closes the socket on %j",
    async (key) => {
      const { socket, writes, endedPromise, isEnded } = fakeSocket();
      handleInput(socket, makeSession(), Buffer.from(key));
      expect(writes.join("")).toContain("Goodbye!");
      expect(isEnded()).toBe(false);
      await endedPromise;
      expect(isEnded()).toBe(true);
    },
  );
});
