import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BunFile } from "bun";
import { create } from "tar";
import { CliError } from "./cliError";

/** fetch towards slidesk.link, reporting an unreachable hub rather than a stack trace. */
export const hubFetch = async (url: string, init?: RequestInit) => {
  try {
    return await fetch(url, init);
  } catch {
    throw new CliError(`Cannot reach ${url}, check your connection`);
  }
};

/** Runs `use` in a temporary directory, removed afterwards whatever happens. */
export const withTempDir = async <T>(use: (dir: string) => Promise<T>) => {
  const dir = await mkdtemp(join(tmpdir(), "slidesk-"));
  try {
    return await use(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

/** Packs `entries` of `cwd` into a temporary gzipped tarball handed to `use`. */
export const withTarball = <T>(
  cwd: string,
  entries: string[],
  use: (tarball: BunFile) => Promise<T>,
) =>
  withTempDir(async (dir) => {
    const file = join(dir, "link.tgz");
    await create({ gzip: true, file, cwd }, entries);
    return use(Bun.file(file));
  });
