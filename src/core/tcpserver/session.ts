import type { BunSocket, SliDeskTelnetSession } from "../../types";
import { ANSI, htmlToAnsi, wrapText } from "./ansi";
import { send, transition } from "./transitions";

export function fetchSlideHtml(session: SliDeskTelnetSession): string {
  try {
    if (!session.config.slides[session.currentSlide])
      throw new Error("Slide not found");
    return session.config.slides[session.currentSlide];
  } catch (e) {
    return `<h2>Loading error</h2><p>${e}</p>`;
  }
}

export function renderStatusBar(
  socket: BunSocket,
  session: SliDeskTelnetSession,
) {
  const { currentSlide, totalSlides, cols, rows } = session;
  const left = " << >> Navigate  |  q Quit  |  r Reload ";
  const right = ` Slide ${currentSlide + 1} / ${totalSlides} `;
  const mid = " ".repeat(Math.max(0, cols - left.length - right.length));
  send(
    socket,
    ANSI.moveTo(rows, 1) +
      ANSI.bg.bright.black +
      ANSI.fg.bright.white +
      ANSI.bold +
      left +
      mid +
      right +
      ANSI.reset,
  );
}

export async function renderSlide(
  socket: BunSocket,
  session: SliDeskTelnetSession,
) {
  if (session.loading) return;
  session.loading = true;

  const { cols, rows } = session;

  await transition(socket, rows);

  send(socket, ANSI.clear + ANSI.hideCursor);
  send(
    socket,
    ANSI.moveTo(Math.floor(rows / 2), Math.floor(cols / 2) - 5) +
      ANSI.fg.cyan +
      ANSI.blink +
      "  Loading..." +
      ANSI.reset,
  );

  const html = fetchSlideHtml(session);
  const content = wrapText(htmlToAnsi(html, cols), cols);

  send(socket, ANSI.clear);

  content
    .split("\r\n")
    .slice(0, rows - 2)
    .forEach((line, i) => {
      send(socket, ANSI.moveTo(i + 1, 1) + line);
    });

  renderStatusBar(socket, session);
  send(socket, ANSI.showCursor);

  session.loading = false;
}
