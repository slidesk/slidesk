import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { create } from "tar";

/** Raised in place of process.exit so a command action stops the way it would in production. */
export class ExitError extends Error {
  constructor(readonly code?: number) {
    super(`process.exit(${code})`);
  }
}

/**
 * The addon commands resolve their install directory from process.cwd(), so the
 * tests run inside a throwaway directory and restore the real one afterwards.
 */
export const useTempCwd = () => {
  const previous = process.cwd();
  process.chdir(mkdtempSync(join(tmpdir(), "slidesk-cmd-")));
  // on macOS the temp dir is reached through a symlink, so the resolved path
  // is read back from the process rather than kept from mkdtemp
  const dir = process.cwd();
  return {
    dir,
    restore: () => {
      process.chdir(previous);
      rmSync(dir, { recursive: true, force: true });
    },
  };
};

/** Builds a real gzipped tarball whose entries live under `root`, and returns it as a Blob. */
export const makeTarball = async (
  root: string,
  files: Record<string, string>,
) => {
  const staging = mkdtempSync(join(tmpdir(), "slidesk-tar-"));
  for (const [name, content] of Object.entries(files)) {
    const target = join(staging, root, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  const tarball = join(staging, "addon.tgz");
  await create({ gzip: true, file: tarball, cwd: staging }, [root]);
  const blob = new Blob([await Bun.file(tarball).arrayBuffer()]);
  rmSync(staging, { recursive: true, force: true });
  return blob;
};

/** A fetch stub recording the urls it was called with. */
export const recordingFetch = (
  responder: (url: string) => Response | Promise<Response>,
) => {
  const urls: string[] = [];
  const impl = async (url: string | Request) => {
    urls.push(typeof url === "string" ? url : url.url);
    return responder(typeof url === "string" ? url : url.url);
  };
  return { urls, impl };
};
