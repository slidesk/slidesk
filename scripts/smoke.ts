import {
  cpSync,
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import launch from "../src/core/browser";

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
  const index = join(dir, "public/index.html");
  check(
    "save exports the talk with its included slides",
    res.code === 0 &&
      existsSync(index) &&
      (await Bun.file(index).text()).includes("Hello <strong>world</strong>"),
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
  const html = (await page?.text()) ?? "";
  check(
    "present serves the talk despite a broken plugin.json",
    page?.status === 200 && html.includes("Welcome"),
    `status ${page?.status}: ${html.slice(0, 500)}`,
  );
  await proc.stdin.write("q\n");
  await proc.stdin.end();
  const code = await Promise.race([
    proc.exited,
    Bun.sleep(10_000).then(() => "timeout"),
  ]);
  check("present quits on q", code === 0, `exit: ${code}`);
  if (code === "timeout") proc.kill();
  const after = await fetch(`http://localhost:${port}/`).catch(() => undefined);
  check("present frees its port when it quits", after === undefined);
}

// the browser side: what #346 fixed was only visible in a real page
const page = await launch(800, 600).catch((e) => {
  // a missing browser must not hide these checks in CI
  if (Bun.env.CI)
    check("a Chromium-based browser is available", false, String(e));
  else log(`⏭️  browser checks skipped: ${e instanceof Error ? e.message : e}`);
  return undefined;
});
if (page) {
  try {
    // the test talk has a plugin adding html after the slides
    const pdfTalk = talk(18808);
    const pdfRun = await run(pdfTalk.dir, [
      "export",
      "-t",
      "pdf",
      "-o",
      "talk.pdf",
    ]);
    const pdf = await Bun.file(join(pdfTalk.dir, "talk.pdf"))
      .text()
      .catch(() => "");
    // page objects may sit in compressed object streams: the page tree's
    // /Count is read too, and whichever is found is used
    const objects = pdf.match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
    const counts = [...pdf.matchAll(/\/Count\s+(\d+)/g)].map((m) =>
      Number(m[1]),
    );
    const pages = Math.max(objects, ...counts, 0);
    await run(pdfTalk.dir, ["save", "-t", "public"]);
    const slides =
      (await Bun.file(join(pdfTalk.dir, "public/index.html")).text()).match(
        /class=sd-slide/g,
      )?.length ?? 0;
    check(
      "export gives one pdf page per slide",
      pdfRun.code === 0 && pages === 3,
      `exit ${pdfRun.code}, ${pages} pages (${objects} page objects, /Count ${counts.join(",") || "none"}, ObjStm: ${pdf.includes("/ObjStm")}), ${slides} slides in the html\n${pdfRun.output}`,
    );

    const { dir } = talk(18806);
    await run(dir, ["save", "-t", "public"]);
    const exported = join(dir, "public");
    const files = Bun.serve({
      port: 0,
      fetch: (req) => {
        const path = new URL(req.url).pathname;
        const file = Bun.file(
          join(exported, path === "/" ? "index.html" : path),
        );
        return file.size
          ? new Response(file)
          : new Response("", { status: 404 });
      },
    });
    await page.goto(`http://localhost:${files.port}/index.html`);
    await Bun.sleep(1500);
    await page.evaluate(
      "(() => { window.__timeouts = 0; const set = window.setTimeout; window.setTimeout = (...a) => { window.__timeouts += 1; return set(...a); }; for (let i = 0; i < 3; i += 1) window.slidesk.next(); return 1; })()",
    );
    await Bun.sleep(1000);
    const first = await page.evaluate<number>("window.__timeouts");
    await Bun.sleep(1000);
    const second = (await page.evaluate<number>("window.__timeouts")) - first;
    check(
      "an exported page served over http does not poll its websocket",
      second === 0,
      `${second} setTimeout calls in the second second`,
    );
    await files.stop(true);

    // a page left open reconnects when present is restarted
    const port = 18807;
    const live = talk(port);
    const start = () =>
      Bun.spawn([bin, "--hidden"], {
        cwd: live.dir,
        stdin: "pipe",
        stdout: "ignore",
        stderr: "ignore",
      });
    const quit = async (proc: ReturnType<typeof start>) => {
      await proc.stdin.write("q\n");
      await proc.stdin.end();
      await proc.exited;
    };
    let present = start();
    await waitFor(`http://localhost:${port}/`);
    await page.goto(`http://localhost:${port}/#1`);
    await Bun.sleep(1000);
    await page.evaluate("(window.__marker = 'stale', 1)");
    await quit(present);
    await Bun.sleep(1000);
    present = start();
    await waitFor(`http://localhost:${port}/`);
    await Bun.sleep(4000);
    const state = await page.evaluate<string>(
      "JSON.stringify([window.__marker ?? 'reloaded', window.slidesk.io?.readyState, window.slidesk.currentSlide])",
    );
    check(
      "a page reconnects and reloads when present restarts",
      state === JSON.stringify(["reloaded", 1, 1]),
      state,
    );
    await quit(present);
  } finally {
    await page.close();
  }
}

rmSync(work, { recursive: true, force: true });
log(
  failures
    ? `\n${failures} smoke check(s) failed`
    : "\nall smoke checks passed",
);
process.exit(failures ? 1 : 0);
