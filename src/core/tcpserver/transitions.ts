import type { BunSocket } from "../../types";
import { ANSI } from "./ansi";

export function send(socket: BunSocket, data: string) {
  socket.write(Buffer.from(data, "utf8"));
}

export async function transition(socket: BunSocket, rows: number) {
  for (let r = 1; r <= rows - 2; r++) {
    send(socket, ANSI.moveTo(r, 1) + ANSI.eraseLine);
    await Bun.sleep(12);
  }
}
