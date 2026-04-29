import type { BunSocket } from "../../types";
import { ANSI } from "./ansi";
import { send } from "./transitions";

export function sendBanner(socket: BunSocket, cols: number) {
  const title = "SliDesk";
  const line = "=".repeat(cols);
  const pad = " ".repeat(Math.floor((cols - title.length) / 2));
  send(
    socket,
    ANSI.clear +
      ANSI.fg.bright.cyan +
      ANSI.bold +
      `${line}\r\n${pad}${title}\r\n${line}\r\n` +
      ANSI.reset +
      ANSI.fg.white +
      "\r\n  << >>  Navigate between slides\r\n" +
      "   1-9   Jump to a slide\r\n" +
      "     r   Reload current slide\r\n" +
      "     q   Quit\r\n\r\n" +
      ANSI.fg.bright.black +
      "  Press any key to start...\r\n" +
      ANSI.reset,
  );
}
