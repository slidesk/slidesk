import type { SliDeskServerOptions } from "../../types";

const { log } = console;

const start =
  process.platform == "darwin"
    ? "open"
    : process.platform == "win32"
      ? "start"
      : "xdg-open";

export default async (https: boolean, options: SliDeskServerOptions) => {
  if (options.notes) {
    log(
      `Your speaker view is available on: \x1b[1m\x1b[36;49mhttp${
        https ? "s" : ""
      }://${options.domain}:${options.port}/notes.html\x1b[0m`,
    );
    if (options.open) {
      Bun.spawn([
        start,
        `http${https ? "s" : ""}://${options.domain}:${
          options.port
        }/notes.html`,
      ]);
    }
  }
  log(
    `Your presentation is available on: \x1b[1m\x1b[36;49mhttp${
      https ? "s" : ""
    }://${options.domain}:${options.port}\x1b[0m`,
  );
  if (options.open && !options.notes) {
    Bun.spawn([
      start,
      `http${https ? "s" : ""}://${options.domain}:${options.port}`,
    ]);
  }
  log();
};
