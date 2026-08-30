import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import { content, errorContent } from "./Convert";

const fixture = join(import.meta.dir, "../__fixtures__/talk");
const mainFile = `${fixture}/main.sdf`;

describe("content", () => {
  it("builds every asset of the presentation", async () => {
    const files = await content(mainFile, {}, {});
    expect(Object.keys(files).sort()).toEqual([
      "favicon.svg",
      "index.html",
      "manifest.json",
      "notes.html",
      "slidesk-notes.css",
      "slidesk-notes.js",
      "slidesk.css",
      "slidesk.js",
    ]);
  });

  it("renders the slides into index.html", async () => {
    const files = await content(mainFile, {}, {});
    const html = files["index.html"].content as string;
    expect(html).toContain("Welcome");
    expect(html).toContain("Intro");
    expect(html).toContain("More");
    expect(html.match(/sd-slide/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("wires the configured styles and scripts into the template", async () => {
    const html = (await content(mainFile, {}, {}))["index.html"]
      .content as string;
    // the output goes through html-minifier-terser, which drops attribute quotes
    expect(html).toContain("href=custom.css");
    expect(html).toContain("src=custom.js");
    expect(html).toContain("href=slidesk.css");
    expect(html).toContain("src=slidesk.js");
  });

  it("references the talk templates and themes assets", async () => {
    const html = (await content(mainFile, {}, {}))["index.html"]
      .content as string;
    expect(html).toContain("templates/tpl.css");
    expect(html).toContain("templates/tpl.js");
    expect(html).toContain("themes/dark/theme.css");
  });

  it("references a theme plugin asset through its theme path", async () => {
    const html = (await content(mainFile, {}, {}))["index.html"]
      .content as string;
    // the theme glob skips anything under /plugins/, the plugin loader adds it
    // back prefixed with the theme it belongs to
    expect(html).toContain("href=/themes/dark/plugins/skipped/skipped.css");
  });

  it("registers the plugin styles, scripts and modules", async () => {
    const html = (await content(mainFile, {}, {}))["index.html"]
      .content as string;
    expect(html).toContain("plugins/demo/demo.css");
    expect(html).toContain("plugins/demo/demo.js");
    expect(html).toContain("plugins/demo/demo.mjs type=module");
  });

  it("uses the talk favicon", async () => {
    const files = await content(mainFile, {}, {});
    expect(files["favicon.svg"].headers["Content-Type"]).toBe("image/svg+xml");
    const html = files["index.html"].content as string;
    expect(html).toContain("favicon.svg");
  });

  it("builds the speaker view with its own assets", async () => {
    const notes = (await content(mainFile, {}, {}))["notes.html"]
      .content as string;
    expect(notes).toContain("slidesk-notes.css");
    expect(notes).toContain("slidesk-notes.js");
    expect(notes).toContain("plugins/demo/speaker.css");
    expect(notes).toContain("plugins/demo/speaker.js");
  });

  it("renames the speaker view when the notes option is set", async () => {
    const files = await content(mainFile, { notes: "secret.html" }, {});
    expect(files["secret.html"]).toBeDefined();
    expect(files["notes.html"]).toBeUndefined();
  });

  it("serves the pwa manifest", async () => {
    const files = await content(mainFile, {}, {});
    expect(JSON.parse(files["manifest.json"].content as string)).toEqual({
      display: "standalone",
      orientation: "landscape",
    });
  });

  it("inlines the html injected by a plugin", async () => {
    const html = (await content(mainFile, {}, {}))["index.html"]
      .content as string;
    expect(html).toContain("<b>snippet</b>");
  });
});

describe("errorContent", () => {
  it("builds a presentation showing the error placeholder", async () => {
    const files = await errorContent({}, {});
    expect(files["index.html"].content).toContain("ERROR");
    expect(files["notes.html"]).toBeDefined();
  });
});
