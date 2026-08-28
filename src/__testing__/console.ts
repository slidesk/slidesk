import { spyOn } from "bun:test";

/**
 * Several modules destructure `console.log` / `console.error` at import time,
 * which pins whichever spy happened to be installed when they were first
 * loaded. Bun runs every test file in one process, so a per-file spy makes the
 * captured output depend on file order. This installs a single process-wide
 * spy instead and lets each test read and clear the shared buffers.
 */
const logs: string[] = [];
const errors: string[] = [];
const warns: unknown[] = [];

const line = (args: unknown[]) => args.map(String).join(" ");

spyOn(console, "log").mockImplementation((...args: unknown[]) => {
  logs.push(line(args));
});
spyOn(console, "error").mockImplementation((...args: unknown[]) => {
  errors.push(line(args));
});
spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
  warns.push(...args);
});

export const captured = {
  logs,
  errors,
  warns,
  clear() {
    logs.length = 0;
    errors.length = 0;
    warns.length = 0;
  },
  /** everything written to console.log, joined — handy for `toContain` */
  log: () => logs.join(" "),
  /** everything written to console.error, joined */
  error: () => errors.join(" "),
};
