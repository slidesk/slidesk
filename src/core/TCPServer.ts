import type {
  BunSocket,
  SliDeskEnv,
  SliDeskServerOptions,
  SliDeskTelnetSession,
  SliDeskTelnetSlidesConfig,
} from "../types";
import { IAC_ENABLE_CHAR_MODE, parseNAWS } from "./tcpserver/ansi";
import { sendBanner } from "./tcpserver/banner";
import { handleInput } from "./tcpserver/input";
import { parseSlides } from "./tcpserver/parse";
import { renderSlide } from "./tcpserver/session";

/**
 * Serves the talk over telnet from the html SliDesk built (rather than asking
 * the web server for it, which failed over https); `update` takes each rebuild.
 */
export function startTelnetServer(
  options: SliDeskServerOptions,
  env: SliDeskEnv,
  html: string,
) {
  const slideskEnv = env.slidesk ?? {};
  const port = Number(slideskEnv?.TELNET_PORT ?? 2323);

  const fullConfig: Required<SliDeskTelnetSlidesConfig> = {
    port,
    totalSlides: 0,
    slides: [],
  };
  const update = (latest: string) => {
    const { total, list } = parseSlides(latest);
    fullConfig.totalSlides = total;
    fullConfig.slides = list.map((l) => l.content);
  };
  update(html);

  const sessions = new WeakMap<BunSocket, SliDeskTelnetSession>();

  const listener = Bun.listen({
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
          if (session.started) await renderSlide(socket, session);
          return;
        }

        if (!session.started) {
          session.started = true;
          await renderSlide(socket, session);
          return;
        }

        // the talk may have been rebuilt since the last key
        session.totalSlides = fullConfig.totalSlides || 1;
        session.currentSlide = Math.min(
          session.currentSlide,
          session.totalSlides - 1,
        );
        await handleInput(socket, session, Buffer.from(data));
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
      key: slideskEnv?.KEY === undefined ? undefined : Bun.file(slideskEnv.KEY),
      cert:
        slideskEnv?.CERT === undefined ? undefined : Bun.file(slideskEnv.CERT),
      passphrase: slideskEnv?.PASSPHRASE,
    },
  });

  console.log(`[telnet] Server started on port ${port}`);
  [
    ...new Set([options.ip, slideskEnv.DOMAIN ?? "localhost", "localhost"]),
  ].forEach((e, _) => {
    // over tls, a plain telnet client cannot connect
    if (e)
      console.log(
        `[telnet] Connect with: ${
          slideskEnv.KEY && slideskEnv.CERT
            ? `openssl s_client -quiet -connect ${e}:${port}`
            : `telnet ${e} ${port}`
        }`,
      );
  });
  return { update, stop: () => listener.stop(true) };
}
