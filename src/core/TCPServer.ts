import type {
  BunSocket,
  SliDeskServerOptions,
  SliDeskTelnetSession,
  SliDeskTelnetSlidesConfig,
  SliDeskTelnetTransition,
} from "../types";
import { IAC_ENABLE_CHAR_MODE, parseNAWS } from "./tcpserver/ansi";
import { sendBanner } from "./tcpserver/banner";
import { handleInput } from "./tcpserver/input";
import { parseSlides } from "./tcpserver/parse";
import { renderSlide } from "./tcpserver/session";

export async function startTelnetServer(
  options: SliDeskServerOptions,
  env: Record<string, unknown | Record<string, unknown>>,
) {
  const slideskEnv = (env.slidesk ?? {}) as Record<string, unknown>;
  const port = Number(slideskEnv?.TELNET_PORT ?? 2323);
  const slideServerUrl = `http://localhost:${Number(slideskEnv?.PORT ?? 1337)}`;
  const transitionType = String(
    slideskEnv?.TELNET_TRANSITION ?? "wipe",
  ) as SliDeskTelnetTransition;

  const html = await (await fetch(slideServerUrl)).text();
  const { total, list } = await parseSlides(html);

  const fullConfig: Required<SliDeskTelnetSlidesConfig> = {
    port: 2323,
    totalSlides: total,
    slides: list.map((l) => l.content),
  };

  const sessions = new WeakMap<BunSocket, SliDeskTelnetSession>();

  Bun.listen({
    hostname: "0.0.0.0",
    port: fullConfig.port,
    socket: {
      open(socket) {
        const session: SliDeskTelnetSession = {
          currentSlide: 0,
          totalSlides: fullConfig.totalSlides ?? 1,
          rows: 24,
          cols: 80,
          loading: false,
          started: false,
          config: fullConfig,
        };
        sessions.set(socket, session);

        socket.write(IAC_ENABLE_CHAR_MODE);
        sendBanner(socket, session.cols);
      },

      async data(socket, data) {
        const session = sessions.get(socket);
        if (!session) return;

        const size = parseNAWS(Buffer.from(data));
        if (size) {
          session.rows = size.rows;
          session.cols = size.cols;
          if (session.started) renderSlide(socket, session);
          return;
        }

        if (!session.started) {
          session.started = true;
          await renderSlide(socket, session);
          return;
        }

        handleInput(socket, session, Buffer.from(data), transitionType);
      },

      close(socket) {
        sessions.delete(socket);
      },

      error(_socket, error) {
        console.error(`[telnet] Socket error: ${error.message}`);
      },

      drain(_socket) {},
    },
    tls: {
      key:
        slideskEnv?.KEY !== undefined
          ? Bun.file(String(slideskEnv.KEY))
          : undefined,
      cert:
        slideskEnv?.CERT !== undefined
          ? Bun.file(String(slideskEnv.CERT))
          : undefined,
      passphrase:
        slideskEnv?.PASSPHRASE !== undefined
          ? String(slideskEnv?.PASSPHRASE)
          : undefined,
    },
  });

  console.log(`[telnet] Server started on port ${port}`);
  [
    ...new Set([options.ip, slideskEnv?.DOMAIN ?? "localhost", "localhost"]),
  ].forEach((e, _) => {
    if (e) console.log(`[telnet] Connect with: telnet ${e} ${port}`);
  });
}
