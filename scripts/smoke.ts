import {
  cpSync,
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Drives the compiled binary the way a user does, on every OS of the CI:
 * the bugs unit tests missed (Ctrl-C, `save -t ..`, include loops, a broken
 * plugin.json at startup) only showed up there.
 */

const { log, error } = console;
const root = join(import.meta.dir, "..");
const work = mkdtempSync(join(tmpdir(), "slidesk-smoke-"));
const bin = join(
  work,
  process.platform === "win32" ? "slidesk.exe" : "slidesk",
);
let failures = 0;

const check = (name: string, ok: boolean, details = "") => {
  log(`${ok ? "✅" : "❌"} ${name}`);
  if (!ok) {
    failures += 1;
    if (details) error(details);
  }
};

const run = async (cwd: string, args: string[]) => {
  const proc = Bun.spawn([bin, ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { code, output: `${out}${err}` };
};

/** A copy of the test talk, inside its own parent so that `..` can be checked. */
const talk = (port: number, main?: string) => {
  const parent = mkdtempSync(join(work, "parent-"));
  const dir = join(parent, "talk");
  cpSync(join(root, "src/__fixtures__/talk"), dir, { recursive: true });
  writeFileSync(
    join(dir, "slidesk.toml"),
    `[slidesk]\nPORT = ${port}\nTRANSITION = 0\n`,
  );
  if (main !== undefined) writeFileSync(join(dir, "main.sdf"), main);
  writeFileSync(join(parent, "sibling.txt"), "precious");
  return { parent, dir };
};

const waitFor = async (url: string) => {
  for (let i = 0; i < 100; i += 1) {
    try {
      return await fetch(url);
    } catch {
      await Bun.sleep(100);
    }
  }
  return undefined;
};

const build = Bun.spawnSync(
  ["bun", "build", "src/index.ts", "--compile", "--outfile", bin],
  { cwd: root, stdout: "inherit", stderr: "inherit" },
);
if (build.exitCode !== 0) {
  error("could not compile slidesk");
  process.exit(1);
}

{
  const { dir } = talk(18801);
  const res = await run(dir, ["save", "-t", "public"]);
  check(
    "save exports the talk",
    res.code === 0 && existsSync(join(dir, "public/index.html")),
    res.output,
  );
  const again = await run(dir, ["save", "-t", "public"]);
  check("save replaces a previous export", again.code === 0, again.output);
}

{
  const { parent, dir } = talk(18802);
  const res = await run(dir, ["save", "-t", ".."]);
  check(
    "save refuses to wipe the parent of the talk",
    res.code === 1 && existsSync(join(parent, "sibling.txt")),
    res.output,
  );
}

{
  const { dir } = talk(18803, "# Loop\n\n## One\n\n!include(.)\n");
  const res = await run(dir, ["save", "-t", "public"]);
  check(
    "save reports an include loop",
    res.code === 1 && res.output.includes("!include loop"),
    res.output,
  );
}

{
  const { dir } = talk(18804);
  const first = await run(dir, ["deploy", "-t", "gitlab"]);
  const second = await run(dir, ["deploy", "-t", "gitlab"]);
  check(
    "deploy keeps an existing file",
    first.code === 0 && second.code === 1,
    `${first.output}${second.output}`,
  );
}

{
  const port = 18805;
  const { dir } = talk(port);
  // a plugin being written must not stop the talk
  cpSync(join(dir, "plugins/demo"), join(dir, "plugins/draft"), {
    recursive: true,
  });
  writeFileSync(join(dir, "plugins/draft/plugin.json"), '{"addHTML":');
  const proc = Bun.spawn([bin, "--hidden"], {
    cwd: dir,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  const page = await waitFor(`http://localhost:${port}/`);
  check(
    "present serves the talk despite a broken plugin.json",
    page?.status === 200 && (await page.text()).includes("Welcome"),
  );
  proc.stdin.write("q\n");
  proc.stdin.end();
  const code = await Promise.race([
    proc.exited,
    Bun.sleep(10_000).then(() => "timeout"),
  ]);
  check("present quits on q", code === 0, `exit: ${code}`);
  if (code === "timeout") proc.kill();
  const after = await fetch(`http://localhost:${port}/`).catch(() => undefined);
  check("present frees its port when it quits", after === undefined);
}

rmSync(work, { recursive: true, force: true });
log(
  failures
    ? `\n${failures} smoke check(s) failed`
    : "\nall smoke checks passed",
);
process.exit(failures ? 1 : 0);
