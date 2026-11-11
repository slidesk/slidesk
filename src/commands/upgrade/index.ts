import { chmod, mkdtemp, realpath, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { Clipse } from "clipse";
import { extract } from "tar";
import packagejson from "../../../package.json";
import { latestVersion } from "../../utils/checkLastVersion";
import { CliError } from "../../utils/cliError";

const { log } = console;

const RELEASES = "https://github.com/slidesk/slidesk/releases";

// the binaries attached to a release, named by .github/workflows/release-files.yml
const ASSETS: Record<string, string> = {
  "linux-x64": "linux-amd",
  "linux-arm64": "linux-arm",
  "darwin-arm64": "mac",
  "darwin-x64": "mac_intel",
};

/** Downloads the release binary and swaps it in place of `exe`. */
const replaceBinary = async (exe: string, tag: string, asset: string) => {
  const res = await fetch(
    `${RELEASES}/download/${tag}/slidesk_${asset}.tar.gz`,
  );
  if (!res.ok) throw new CliError(`could not download SliDesk ${tag}`);
  const tmp = await mkdtemp(join(tmpdir(), "slidesk-"));
  // written next to the binary so the rename is atomic, even while it runs
  const next = `${exe}.new`;
  try {
    await Bun.write(`${tmp}/slidesk.tgz`, res);
    await extract({ file: `${tmp}/slidesk.tgz`, C: tmp });
    await Bun.write(next, Bun.file(`${tmp}/slidesk_${asset}`));
    await chmod(next, 0o755);
    await rename(next, exe);
  } catch (e) {
    await rm(next, { force: true });
    if ((e as { code?: string }).code === "EACCES")
      throw new CliError(
        `${exe} is not writable: run \`sudo slidesk upgrade\``,
      );
    throw e;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
};

const upgradeCmd = new Clipse(
  "upgrade",
  "upgrade SliDesk to its latest release",
);
upgradeCmd.action(async () => {
  if (/^bun(\.exe)?$/.test(basename(process.execPath)))
    throw new CliError(
      "SliDesk runs through Bun: `bunx slidesk@latest` runs the latest release",
    );
  const tag = await latestVersion(5000).catch(() => "");
  if (!tag) throw new CliError("could not read the latest SliDesk release");
  if (Bun.semver.order(tag, packagejson.version) <= 0) {
    log(`SliDesk ${packagejson.version} is up to date`);
    return;
  }
  const exe = await realpath(process.execPath);
  if (exe.includes("/Cellar/")) {
    const brew = Bun.spawn(["brew", "upgrade", "gouz/tools/slidesk"], {
      stdio: ["inherit", "inherit", "inherit"],
    });
    if (await brew.exited) throw new CliError("brew upgrade failed");
    return;
  }
  const asset = ASSETS[`${process.platform}-${process.arch}`];
  if (!asset)
    throw new CliError(`download SliDesk ${tag} from ${RELEASES}/latest`);
  await replaceBinary(exe, tag, asset);
  log(`SliDesk upgraded from ${packagejson.version} to ${tag}`);
});

export default upgradeCmd;
