import type { BunSocket, SliDeskTelnetSession } from "../../types";
import { ANSI } from "./ansi";
import { renderSlide, renderStatusBar } from "./session";
import { send } from "./transitions";

export async function handleInput(
  socket: BunSocket,
  session: SliDeskTelnetSession,
  data: Buffer,
) {
  if (data[0] === 255) return;

  // telnet sends Enter as \r\0 or \r\n
  const key = data.toString("utf8").replace(/^\r[\0\n]$/, "\r");

  // digits -> the slide Enter goes to; each key arrives on its own
  if (/^\d+$/.test(key)) {
    session.typed = `${session.typed ?? ""}${key}`;
    renderStatusBar(socket, session);
    return;
  }
  const typed = session.typed;
  session.typed = undefined;
  if (typed && key === "\r") {
    const num = Number.parseInt(typed, 10);
    if (num >= 1 && num <= session.totalSlides) {
      session.currentSlide = num - 1;
      await renderSlide(socket, session);
    } else renderStatusBar(socket, session);
    return;
  }

  // Right arrow / space / enter -> next slide
  if (key === "\x1b[C" || key === " " || key === "\r") {
    if (session.currentSlide < session.totalSlides - 1) {
      session.currentSlide++;
      await renderSlide(socket, session);
    }
    return;
  }

  // Left arrow / backspace -> previous slide
  if (key === "\x1b[D" || key === "\x7f" || key === "\x08") {
    if (session.currentSlide > 0) {
      session.currentSlide--;
      await renderSlide(socket, session);
    }
    return;
  }

  // r -> reload
  if (key === "r" || key === "R") {
    await renderSlide(socket, session);
    return;
  }

  // q / Ctrl+C -> disconnect
  if (key === "q" || key === "Q" || key === "\x03") {
    send(
      socket,
      ANSI.clear +
        ANSI.fg.bright.yellow +
        "\r\n  Goodbye! \r\n\r\n" +
        ANSI.reset,
    );
    setTimeout(() => socket.end(), 500);
  }
}
