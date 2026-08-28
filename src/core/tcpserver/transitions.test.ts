import { describe, expect, it } from "bun:test";
import type { BunSocket } from "../../types";
import { ANSI } from "./ansi";
import { send, transition } from "./transitions";

const fakeSocket = () => {
  const writes: string[] = [];
  const socket = {
    write: (data: Buffer) => {
      writes.push(data.toString("utf8"));
      return data.length;
    },
  } as unknown as BunSocket;
  return { socket, writes };
};

describe("send", () => {
  it("writes the payload as a utf8 buffer", () => {
    const { socket, writes } = fakeSocket();
    send(socket, "héllo");
    expect(writes).toEqual(["héllo"]);
  });
});

describe("transition", () => {
  it("erases every line but the last two", async () => {
    const { socket, writes } = fakeSocket();
    await transition(socket, 5);
    expect(writes).toEqual([
      ANSI.moveTo(1, 1) + ANSI.eraseLine,
      ANSI.moveTo(2, 1) + ANSI.eraseLine,
      ANSI.moveTo(3, 1) + ANSI.eraseLine,
    ]);
  });

  it("writes nothing when there is no room", async () => {
    const { socket, writes } = fakeSocket();
    await transition(socket, 2);
    expect(writes).toEqual([]);
  });
});
