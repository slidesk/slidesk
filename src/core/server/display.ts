import { toString as QRCODE } from "qrcode";
import type { SliDeskServerOptions } from "../../types";
import start from "../../utils/start";

const { log } = console;

const display = async (
  env: Record<string, unknown>,
  options: SliDeskServerOptions,
) => {
  const https = env?.HTTPS ?? false;
  const port = Number(env?.PORT ?? 1337);
  if (options.notes) {
    const url = `http${
      https ? "s" : ""
    }://${options.ip}:${port}/${options.notes}`;
    log(`Your speaker view is available on: \x1b[1m\x1b[36;49m${url}\x1b[0m`);
    QRCODE(
      url,
      { type: "terminal", errorCorrectionLevel: "L", small: true },
      (_, url) => {
        log(url);
      },
    );
    if (options.open) {
      Bun.spawn([
        start(),
        `http${https ? "s" : ""}://localhost:${port}/${options.notes}`,
      ]);
    }
  }
  [
    ...new Set([
      options.ip,
      (env?.DOMAIN as string) ?? "localhost",
      "localhost",
    ]),
  ].forEach((e, _) => {
    if (e)
      log(
        `Your presentation is available on: \x1b[1m\x1b[36;49mhttp${
          https ? "s" : ""
        }://${e}:${port}\x1b[0m`,
      );
  });
  if (options.open && !options.notes) {
    Bun.spawn([start(), `http${https ? "s" : ""}://localhost:${port}`]);
  }
  log();
};

export default display;
