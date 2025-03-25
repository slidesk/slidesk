import open, { apps } from "open";
import type { ServerOptions } from "../../types";

const { log } = console;

const getBrowser = (open: string) => {
  if (open === "firefox") return apps.firefox;
  if (open === "chrome") return apps.chrome;
  if (open === "edge") return apps.edge;
  return apps.browser;
};

export default async (https: boolean, options: ServerOptions) => {
  if (options.notes) {
    log(
      `Your speaker view is available on: \x1b[1m\x1b[36;49mhttp${
        https ? "s" : ""
      }://${options.domain}:${options.port}/notes.html\x1b[0m`,
    );
    if (options.open) {
      await open(
        `http${https ? "s" : ""}://${options.domain}:${
          options.port
        }/notes.html`,
        { app: { name: getBrowser(options.open) } },
      );
    }
  }
  log(
    `Your presentation is available on: \x1b[1m\x1b[36;49mhttp${
      https ? "s" : ""
    }://${options.domain}:${options.port}\x1b[0m`,
  );
  if (options.open && !options.notes) {
    const br =
      options.open === "firefox"
        ? apps.firefox
        : options.open === "chrome"
          ? apps.chrome
          : options.open === "edge"
            ? apps.edge
            : apps.browser;
    await open(`http${https ? "s" : ""}://${options.domain}:${options.port}`, {
      app: { name: br },
    });
  }
  log();
};
