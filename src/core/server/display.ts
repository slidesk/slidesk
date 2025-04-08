import type { SliDeskServerOptions } from "../../types";
import { toString as QRCODE } from "qrcode";

const { log } = console;

const start =
  process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
      ? "start"
      : "xdg-open";

export default async (https: boolean, options: SliDeskServerOptions) => {
  if (options.notes) {
    const url = `http${
      https ? "s" : ""
    }://${options.domain}:${options.port}/${options.notes === true ? "notes.html" : options.notes}`;
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
        start,
        `http${https ? "s" : ""}://${options.domain}:${options.port}/${options.notes === true ? "notes.html" : options.notes}`,
      ]);
    }
  }
  log(
    `Your presentation is available on: \x1b[1m\x1b[36;49mhttp${
      https ? "s" : ""
    }://${options.domain}:${options.port}\x1b[0m`,
  );
  log(
    `Your presentation is available on: \x1b[1m\x1b[36;49mhttp://localhost:${options.port}\x1b[0m`,
  );
  if (options.open && !options.notes) {
    Bun.spawn([start, `http://localhost:${options.port}`]);
  }
  log();
};
