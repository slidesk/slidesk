import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Bun only reports the files a test actually imported, so a module with no test
 * at all is simply absent from the report and silently inflates the percentage.
 * This gate reads coverage/lcov.info, then adds back every source file that was
 * never loaded and counts it as fully uncovered.
 */

const THRESHOLD = Number(Bun.env.COVERAGE_THRESHOLD ?? process.argv[2] ?? 80);
const LCOV = "coverage/lcov.info";
const IGNORED = ["__fixtures__", "__testing__"];

const { log, error } = console;

const isSource = (path: string) =>
  path.startsWith("src/") &&
  path.endsWith(".ts") &&
  !path.endsWith(".test.ts") &&
  !path.endsWith("/types.ts") &&
  !IGNORED.some((dir) => path.includes(dir));

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

const lineCount = (path: string) =>
  readFileSync(path, "utf8").split("\n").length;

const readLcov = () => {
  const report: Record<string, { found: number; hit: number }> = {};
  let current = "";
  for (const raw of readFileSync(LCOV, "utf8").split("\n")) {
    const line = raw.trim();
    if (line.startsWith("SF:")) current = line.slice(3);
    else if (line.startsWith("LF:") && isSource(current))
      report[current] = { found: Number(line.slice(3)), hit: 0 };
    else if (line.startsWith("LH:") && report[current])
      report[current].hit = Number(line.slice(3));
  }
  return report;
};

if (!existsSync(LCOV)) {
  error(`${LCOV} not found — run \`bun test\` first`);
  process.exit(1);
}

const report = readLcov();
const sources = walk("src").filter(isSource);
const missing = sources.filter((path) => report[path] === undefined);

const found = Object.values(report).reduce((acc, f) => acc + f.found, 0);
const hit = Object.values(report).reduce((acc, f) => acc + f.hit, 0);

// the executable lines of a file the report never saw are unknown, so they are
// estimated from the ratio of executable to physical lines observed elsewhere
const measured = sources.filter((path) => report[path] !== undefined);
const ratio = measured.length
  ? found / measured.reduce((acc, path) => acc + lineCount(path), 0)
  : 1;
const missingLines = Math.round(
  missing.reduce((acc, path) => acc + lineCount(path), 0) * ratio,
);

const total = found + missingLines;
const percent = total === 0 ? 100 : (hit / total) * 100;

log(`Files measured : ${measured.length}`);
log(`Lines covered  : ${hit}/${found} of the measured files`);

if (missing.length) {
  log(`\nNever loaded by a test (~${missingLines} lines, counted as 0%):`);
  for (const path of missing.sort()) log(`  ${path}`);
}

const partial = Object.entries(report)
  .filter(([, f]) => f.hit < f.found)
  .sort((a, b) => a[1].hit / a[1].found - b[1].hit / b[1].found);
if (partial.length) {
  log("\nPartially covered:");
  for (const [path, f] of partial)
    log(`  ${((f.hit / f.found) * 100).toFixed(1).padStart(5)}%  ${path}`);
}

log(`\nOverall coverage: ${percent.toFixed(2)}% (threshold ${THRESHOLD}%)`);

if (percent < THRESHOLD) {
  error(`❌ coverage is below the ${THRESHOLD}% threshold`);
  process.exit(1);
}
log("✅ coverage threshold met");
