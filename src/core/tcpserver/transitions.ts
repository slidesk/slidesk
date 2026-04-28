import type { BunSocket, SliDeskTelnetTransition } from "../../types";
import { ANSI } from "./ansi";

export function send(socket: BunSocket, data: string) {
  socket.write(Buffer.from(data, "utf8"));
}

export async function transition(
  socket: BunSocket,
  type: SliDeskTelnetTransition,
  rows: number,
  cols: number,
) {
  switch (type) {
    case "fade": {
      for (const ch of ["\u2588", "\u2593", "\u2592", "\u2591", " "]) {
        send(socket, ANSI.moveTo(1, 1));
        for (let r = 0; r < rows - 2; r++)
          send(
            socket,
            `${ANSI.fg.bright.black}${ch.repeat(cols)}${ANSI.reset}\r\n`,
          );
        await Bun.sleep(40);
      }
      break;
    }
    case "slide-left": {
      for (let i = cols; i >= 0; i -= 8) {
        for (let r = 0; r < rows - 2; r++) {
          send(socket, ANSI.eraseLine + ANSI.moveTo(r + 1, i));
          send(socket, `${ANSI.fg.bright.black}\u2590${ANSI.reset}`);
        }
        await Bun.sleep(16);
      }
      break;
    }
    case "slide-right": {
      for (let i = 0; i <= cols; i += 8) {
        for (let r = 0; r < rows - 2; r++) {
          send(socket, ANSI.moveTo(r + 1, i));
          send(socket, `${ANSI.fg.bright.black}\u258c${ANSI.reset}`);
        }
        await Bun.sleep(16);
      }
      break;
    }
    case "wipe": {
      for (let r = 1; r <= rows - 2; r++) {
        send(socket, ANSI.moveTo(r, 1) + ANSI.eraseLine);
        await Bun.sleep(12);
      }
      break;
    }
  }
}
