import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { recordingFetch, useTempCwd } from "../../__testing__/addons";
import { captured } from "../../__testing__/console";
import { runCommand } from "../../utils/cliError";

const { default: designCmd, extractDesign } = await import("./index");

const SITE = "https://site.test";
const HTML = `<html><head>
<meta name="theme-color" content="#ff0000">
<link rel="stylesheet" href="/main.css">
<link href="https://fonts.googleapis.com/css2?family=Inter&amp;display=swap" rel="stylesheet">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>h1 { font-family: "Serif Co", serif; color: #111 }</style>
</head><body><img class="site-logo" src="/img/brand.svg?v=2" alt=""></body></html>`;
const CSS = `:root { --brand-primary: #0055ff; --bg: #fafafa }
body { background: var(--bg); color: rgb(20, 20, 20); font-family: Inter, sans-serif }
@font-face { font-family: "Serif Co"; src: url(fonts/serif.woff2) }`;

let cwd: ReturnType<typeof useTempCwd>;
let fetchSpy: ReturnType<typeof spyOn> | undefined;

beforeEach(() => {
  captured.clear();
  cwd = useTempCwd();
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
  cwd.restore();
});

describe("extractDesign", () => {
  it("reads the colours and fonts of the page", () => {
    const d = extractDesign(HTML, [
      { css: CSS, base: `${SITE}/main.css` },
      { css: 'h1 { font-family: "Serif Co", serif; color: #111 }', base: SITE },
    ]);
    expect(d).toMatchObject({
      background: "#fafafa",
      text: "rgb(20, 20, 20)",
      primary: "#0055ff",
      font: "Inter, sans-serif",
      headingFont: '"Serif Co", serif',
      googleFonts: [
        "https://fonts.googleapis.com/css2?family=Inter&display=swap",
      ],
    });
    expect(d.fontFaces[0]).toContain(`url(${SITE}/fonts/serif.woff2)`);
    expect(d.logo).toBe("/img/brand.svg?v=2");
  });

  it("falls back on the theme colour, then the most used saturated one", () => {
    expect(extractDesign(HTML, []).primary).toBe("#ff0000");
    const d = extractDesign("", [
      {
        css: "a { color: #00aa00 } b { color: #00aa00 } i { color: #eee }",
        base: SITE,
      },
    ]);
    expect(d.primary).toBe("#00aa00");
    expect(d.background).toBe("#ffffff");
    expect(
      extractDesign('<link href="/i.svg" rel="icon" type="image/svg+xml">', [])
        .logo,
    ).toBe("/i.svg");
    expect(d.logo).toBeUndefined();
  });

  it("picks a readable text colour on a dark background", () => {
    expect(
      extractDesign("", [
        { css: "body { background-color: #000 }", base: SITE },
      ]).text,
    ).toBe("#ffffff");
  });
});

describe("design command", () => {
  const run = (argv: string[]) => runCommand(() => designCmd.ready(argv));

  it("writes a theme named after the website", async () => {
    const { urls, impl } = recordingFetch(
      (url) => new Response(url.endsWith("main.css") ? CSS : HTML),
    );
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation(impl as never);
    expect(await run([SITE])).toBe(0);
    expect(urls).toEqual([
      `${SITE}/`,
      `${SITE}/main.css`,
      `${SITE}/img/brand.svg?v=2`,
    ]);
    expect(existsSync(join(cwd.dir, "themes/site-test/logo.svg"))).toBe(true);
    const css = await Bun.file(
      join(cwd.dir, "themes/site-test/theme.css"),
    ).text();
    expect(css).toContain("--sd-primary-color: #0055ff;");
    expect(css).toContain("--sd-heading-color: var(--sd-primary-color);");
    expect(css).toContain('url("logo.svg")');
    expect(css).toContain('@import url("https://fonts.googleapis.com/');
    expect(captured.log()).toContain("theme site-test created");
  });

  it("downloads the fonts into the theme with --local", async () => {
    const { impl } = recordingFetch((url) => {
      if (url.endsWith("main.css")) return new Response(CSS);
      if (url.includes("googleapis"))
        return new Response(
          "/* latin */ @font-face { font-family: Inter; src: url(https://fonts.gstatic.test/inter.woff2) }",
        );
      if (url.endsWith(".woff2")) return new Response("font");
      return new Response(HTML);
    });
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation(impl as never);
    expect(await run([SITE, "--local"])).toBe(0);
    const dir = join(cwd.dir, "themes/site-test");
    const css = await Bun.file(join(dir, "theme.css")).text();
    expect(css).not.toContain("http");
    expect(css).toContain("url(fonts/inter.woff2)");
    expect(css).toContain("url(fonts/serif.woff2)");
    expect(await Bun.file(join(dir, "fonts/inter.woff2")).text()).toBe("font");
    expect(existsSync(join(dir, "fonts/serif.woff2"))).toBe(true);
  });

  it("does not overwrite a theme without --force", async () => {
    await Bun.write(join(cwd.dir, "themes/mine/theme.css"), "kept");
    expect(await run([SITE, "-n", "mine"])).toBe(1);
    expect(captured.error()).toContain("already exists");
    expect(await Bun.file(join(cwd.dir, "themes/mine/theme.css")).text()).toBe(
      "kept",
    );
  });

  it("refuses something that is not a URL", async () => {
    expect(await run(["nope"])).toBe(1);
    expect(captured.error()).toContain("Please provide the URL");
    expect(existsSync(join(cwd.dir, "themes"))).toBe(false);
  });
});

it("ignores a text colour that would not read on the background", () => {
  const d = extractDesign("", [
    { css: "body { background: #fff; color: #fafafa }", base: SITE },
  ]);
  expect(d.text).toBe("#1a1a1a");
});
