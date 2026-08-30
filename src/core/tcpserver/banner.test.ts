import { describe, expect, it } from "bun:test";
import type { BunSocket } from "../../types";
import { ANSI } from "./ansi";
import { sendBanner } from "./banner";

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

describe("sendBanner", () => {
  it("clears the screen and centers the title", () => {
    const { socket, writes } = fakeSocket();
    sendBanner(socket, 21);
    expect(writes).toHaveLength(1);
    const out = writes[0];
    expect(out.startsWith(ANSI.clear)).toBe(true);
    expect(out).toContain("=".repeat(21));
    expect(out).toContain(`${" ".repeat(7)}SliDesk`);
  });

  it("lists the available shortcuts", () => {
    const { socket, writes } = fakeSocket();
    sendBanner(socket, 40);
    expect(writes[0]).toContain("Navigate between slides");
    expect(writes[0]).toContain("Jump to a slide");
    expect(writes[0]).toContain("Reload current slide");
    expect(writes[0]).toContain("Quit");
    expect(writes[0]).toContain("Press any key to start...");
  });
});
