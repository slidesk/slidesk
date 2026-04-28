import type {
  BunSocket,
  SliDeskTelnetSession,
  SliDeskTelnetTransition,
} from "../../types";
import { ANSI } from "./ansi";
import { renderSlide } from "./session";
import { send } from "./transitions";

export function handleInput(
  socket: BunSocket,
  session: SliDeskTelnetSession,
  data: Buffer,
  transitionType: SliDeskTelnetTransition,
) {
  if (data[0] === 255) return;

  const key = data.toString("utf8");

  // Right arrow / space / enter -> next slide
  if (key === "\x1b[C" || key === " " || key === "\r" || key === "\r\n") {
    if (session.currentSlide < session.totalSlides - 1) {
      session.currentSlide++;
      renderSlide(socket, session, transitionType);
    }
    return;
  }

  // Left arrow / backspace -> previous slide
  if (key === "\x1b[D" || key === "\x7f" || key === "\x08") {
    if (session.currentSlide > 0) {
      session.currentSlide--;
      renderSlide(socket, session, transitionType);
    }
    return;
  }

  // Digit -> direct jump
  const num = parseInt(key, 10);
  if (!isNaN(num) && num >= 1 && num <= session.totalSlides) {
    session.currentSlide = num - 1;
    renderSlide(socket, session, "fade");
    return;
  }

  // r -> reload
  if (key === "r" || key === "R") {
    renderSlide(socket, session);
    return;
  }

  // q / Ctrl+C -> disconnect
  if (key === "q" || key === "Q" || key === "\x03") {
    send(
      socket,
      ANSI.clear + ANSI.fg.bright.yellow + "\n  Goodbye! \n\n" + ANSI.reset,
    );
    setTimeout(() => socket.end(), 500);
  }
}
