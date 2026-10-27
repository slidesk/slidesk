import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import launch from "../src/core/browser";

/**
 * Records docs/_media/demo.gif, shown at the top of the README: a small talk
 * presented in Chrome, then edited while presenting. Needs ffmpeg and a
 * Chromium-based browser. Run again after a change of the default styles.
 */

const { log, error } = console;
const root = join(import.meta.dir, "..");
const work = mkdtempSync(join(tmpdir(), "slidesk-demo-"));
const talk = join(work, "talk");
const frames = join(work, "frames");
const output = join(root, "docs/_media/demo.gif");
const port = 18990;
const [width, height] = [1280, 720];

const write = (file: string, content: string) =>
  Bun.write(join(talk, file), content, { createPath: true });

await write("slidesk.toml", `[slidesk]\nPORT = ${port}\nTRANSITION = 0\n`);
await write(
  "main.md",
  `# Your talk, in Markdown

!include(slides)
`,
);
await write(
  "slides/01-why.md",
  `## Why SliDesk?

- One Markdown file, one binary
- Translations from a single source
- Speaker view, timers and notes
- Export to PDF or PowerPoint
`,
);
await write(
  "slides/02-code.md",
  `## Slides are Markdown

\`\`\`markdown
## Hello 👋

!include(slides)

/*
Notes for the speaker view
*/
\`\`\`
`,
);
const lastSlide = "slides/03-live.md";
await write(lastSlide, "## Edit it while presenting…\n");

// present resolves the talk from its working directory
const present = Bun.spawn(
  ["bun", join(root, "src/index.ts"), "talk", "--hidden"],
  {
    cwd: work,
    stdin: "pipe",
    stdout: "ignore",
    stderr: "ignore",
  },
);
for (let i = 0; i < 100; i += 1) {
  // polling: each attempt waits for the previous one
  const up = await fetch(`http://localhost:${port}/`).catch(() => null); // NOSONAR
  if (up) break;
  await Bun.sleep(100); // NOSONAR
}

const page = await launch(width, height);
const shots: { file: string; seconds: number }[] = [];
const shoot = async (seconds: number) => {
  const file = join(frames, `${String(shots.length).padStart(3, "0")}.png`);
  await Bun.write(file, await page.screenshot());
  shots.push({ file, seconds });
};
const next = async () => {
  await page.evaluate("window.slidesk.next()");
  await Bun.sleep(400);
};

try {
  await page.goto(`http://localhost:${port}/`);
  await Bun.sleep(1500);
  await shoot(2);
  await next();
  await shoot(2.5);
  await next();
  await shoot(2.5);
  await next();
  await shoot(1.5);
  // the edit is typed in two steps, then the page reloads on its own
  await write(lastSlide, "## Edit it while presenting…\n\n…and it reloads.\n");
  await Bun.sleep(2000);
  await shoot(1.5);
  await write(
    lastSlide,
    "## Edit it while presenting…\n\n…and it reloads. ✨\n\n`slidesk my-talk`\n",
  );
  await Bun.sleep(2000);
  await shoot(3);
} finally {
  await page.close();
  await present.stdin.write("q\n");
  await present.stdin.end();
  await present.exited;
}

// the concat demuxer gives each screenshot its own duration
const list = join(work, "frames.txt");
writeFileSync(
  list,
  `${shots.map((s) => `file '${s.file}'\nduration ${s.seconds}`).join("\n")}\nfile '${shots.at(-1)?.file}'\n`,
);
const ffmpeg = Bun.spawnSync(
  [
    "ffmpeg",
    "-y",
    "-loglevel",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    list,
    "-vf",
    "fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse",
    output,
  ],
  { stderr: "pipe" },
);
rmSync(work, { recursive: true, force: true });
if (ffmpeg.exitCode !== 0) {
  error(ffmpeg.stderr.toString());
  process.exit(1);
}
log(`${output} (${Math.round(Bun.file(output).size / 1024)} KB)`);
