import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { useTempCwd } from "../__testing__/addons";
import { addonInstall, installedAddons, isGitUrl } from "./addon";

const realSpawn = Bun.spawn;
let cwd: ReturnType<typeof useTempCwd>;
let repos: string;
let spawn: ReturnType<typeof spyOn>;

/** A git repository holding `files`, cloned when `https://git.test/<name>.git` is asked. */
const repo = (name: string, files: Record<string, string>) => {
  const dir = join(repos, name);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), content);
  }
  gitIn(dir, "init", "-q");
  commit(dir);
  return `https://git.test/${name}.git`;
};

const gitIn = (dir: string, ...args: string[]) =>
  Bun.spawnSync(["git", "-C", dir, ...args], {
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@t",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@t",
    },
  });

const commit = (dir: string) => {
  gitIn(dir, "add", ".");
  gitIn(dir, "commit", "-qm", "change");
};

const install = (kind: Parameters<typeof addonInstall>[0], url: string) =>
  addonInstall(kind, url, undefined, false, cwd.dir);

beforeEach(() => {
  cwd = useTempCwd();
  repos = mkdtempSync(join(tmpdir(), "slidesk-repos-"));
  // the remote is served by the local repository of the same name
  spawn = spyOn(Bun, "spawn").mockImplementation(((cmd: string[], o: object) =>
    realSpawn(
      cmd.map((a) =>
        a.startsWith("https://git.test/")
          ? join(repos, a.slice(17).replace(/\.git$/, ""))
          : a,
      ),
      o,
    )) as never);
});

afterEach(() => {
  spawn.mockRestore();
  cwd.restore();
  rmSync(repos, { recursive: true, force: true });
});

describe("install from git", () => {
  it("tells a git repository from a hub name", () => {
    expect(isGitUrl("https://github.com/someone/my-theme.git")).toBe(true);
    expect(isGitUrl("git@github.com:someone/my-theme.git")).toBe(true);
    expect(isGitUrl("ssh://git@host/x/y.git")).toBe(true);
    expect(isGitUrl("@gouz/night")).toBe(false);
    expect(isGitUrl("--upload-pack=touch /tmp/x")).toBe(false);
    expect(isGitUrl("ext::sh -c touch")).toBe(false);
    expect(isGitUrl("/tmp/my-theme")).toBe(false);
  });

  it("installs a theme under the name of its repository", async () => {
    const url = repo("my-theme", {
      "theme.json": "{}",
      "assets/style.css": "body{}",
    });
    expect(await install("theme", url)).toBe(
      `theme my-theme installed from ${url}`,
    );
    const dir = join(cwd.dir, "themes/my-theme");
    expect(readFileSync(join(dir, "assets/style.css"), "utf8")).toBe("body{}");
    // kept, so that an update pulls it
    expect(existsSync(join(dir, ".git"))).toBe(true);
    expect(readdirSync(join(cwd.dir, "themes"))).toEqual(["my-theme"]);
  });

  it("replaces the installed version", async () => {
    const url = repo("my-theme", { "theme.json": "{}" });
    mkdirSync(join(cwd.dir, "themes/my-theme"), { recursive: true });
    writeFileSync(join(cwd.dir, "themes/my-theme/old.css"), "");
    await addonInstall("theme", url, undefined, true, cwd.dir);
    expect(readdirSync(join(cwd.dir, "themes/my-theme")).sort()).toEqual([
      ".git",
      "theme.json",
    ]);
  });

  it("installs a plugin under the name its manifest uses", async () => {
    const url = repo("slidesk-plugin-steps", {
      "plugin.json": '{ "addScripts": ["plugins/steps/steps.js"] }',
      "steps.js": "",
    });
    expect(await install("plugin", url)).toStartWith("plugin steps installed");
    expect(existsSync(join(cwd.dir, "plugins/steps/steps.js"))).toBe(true);
  });

  it("installs a component as a single .mjs", async () => {
    const url = repo("qrcode", { "README.md": "", "src/qrcode.mjs": "x" });
    await install("component", url);
    expect(readdirSync(join(cwd.dir, "components"))).toEqual(["qrcode.mjs"]);
  });

  it("force-pulls an addon installed from git, by its name", async () => {
    await install("theme", repo("my-theme", { "theme.json": "{}" }));
    const installed = join(cwd.dir, "themes/my-theme");
    expect(installedAddons("theme", cwd.dir)).toEqual(["my-theme"]);
    writeFileSync(join(installed, "theme.json"), "local change");
    writeFileSync(join(repos, "my-theme/theme.json"), '{"v":2}');
    commit(join(repos, "my-theme"));
    expect(
      await addonInstall("theme", "my-theme", undefined, true, cwd.dir),
    ).toBe("theme my-theme updated");
    expect(readFileSync(join(installed, "theme.json"), "utf8")).toBe('{"v":2}');
  });

  it("reports an addon whose repository cannot be pulled", async () => {
    await install("theme", repo("gone", { "theme.json": "{}" }));
    rmSync(join(repos, "gone"), { recursive: true });
    await expect(
      addonInstall("theme", "gone", undefined, true, cwd.dir),
    ).rejects.toThrow("theme gone could not be updated:");
  });

  it("refuses a repository without the manifest of the kind", async () => {
    const url = repo("not-a-theme", { "plugin.json": "{}" });
    await expect(install("theme", url)).rejects.toThrow(
      "holds no theme.json: it is not a theme",
    );
    expect(readdirSync(join(cwd.dir, "themes"))).toEqual([]);
  });

  it("reports why a repository could not be cloned", async () => {
    await expect(
      install("theme", "https://git.test/missing.git"),
    ).rejects.toThrow("https://git.test/missing.git could not be cloned:");
  });
});
