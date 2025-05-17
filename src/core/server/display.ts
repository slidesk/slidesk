import type { SliDeskServerOptions } from "../../types";
import { toString as QRCODE } from "qrcode";
import start from "../../utils/start";

const { log } = console;

export default async (https: boolean, options: SliDeskServerOptions) => {
  if (options.notes) {
    const url = `http${
      https ? "s" : ""
    }://${options.ip}:${options.port}/${options.notes}`;
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
        `http${https ? "s" : ""}://localhost:${options.port}/${options.notes}`,
      ]);
    }
  }
  [...new Set([options.ip, options.domain, "localhost"])].forEach((e, _) => {
    if (e)
      log(
        `Your presentation is available on: \x1b[1m\x1b[36;49mhttp${
          https ? "s" : ""
        }://${e}:${options.port}\x1b[0m`,
      );
  });
  if (options.open && !options.notes) {
    Bun.spawn([start(), `http://localhost:${options.port}`]);
  }
  log();
};
