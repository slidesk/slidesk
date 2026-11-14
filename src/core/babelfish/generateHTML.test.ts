import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import generateHTML from "./generateHTML";

describe("generateHTML function", () => {
  it("reports a --lang without its translation file", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
    writeFileSync(`${tempDir}en.lang.json`, '{"translations": {}}');
    writeFileSync(`${tempDir}fr.lang.json`, '{"translations": {}}');
    expect(
      generateHTML("", "#SECTIONS#", tempDir, { lang: "xx" }, {}, []),
    ).rejects.toThrow("xx.lang.json not found (available: en, fr)");
    rmSync(tempDir, { recursive: true });
  });

  it("should generate HTML without translations", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
    writeFileSync(`${tempDir}index.html`, "<html></html>");

    const result = await generateHTML(
      "<section>Slide 1</section>",
      "<html>#SECTIONS#</html>",
      tempDir,
      {},
      {},
      [],
    );

    expect(result["index.html"]).toBeDefined();
    expect(result["index.html"].content).toContain(
      "<section>Slide 1</section>",
    );
    rmSync(tempDir, { recursive: true });
  });

  it("should generate HTML with translations", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
    writeFileSync(
      `${tempDir}en.lang.json`,
      JSON.stringify({ default: true, hello: "Hello" }),
    );
    writeFileSync(`${tempDir}index.html`, "<html></html>");

    const result = await generateHTML(
      "<section>hello</section>",
      "<html>#SECTIONS#</html>",
      tempDir,
      {},
      {},
      [],
    );

    expect(result["index.html"]).toBeDefined();
    rmSync(tempDir, { recursive: true });
  });

  it("names the tab in the language of the talk", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
    writeFileSync(
      `${tempDir}en.lang.json`,
      JSON.stringify({ translations: { t: "*My* talk" } }),
    );
    writeFileSync(
      `${tempDir}fr.lang.json`,
      JSON.stringify({ default: true, translations: { t: "Mon talk" } }),
    );
    const result = await generateHTML(
      "<p>x</p>",
      "<title>#TITLE#</title>#SECTIONS#",
      tempDir,
      { lang: "en" },
      { slidesk: { TITLE: "$$t$$" } },
      [],
    );
    expect(result["index.html"].content).toContain("<title>My talk</title>");
    rmSync(tempDir, { recursive: true });
  });

  it("should use specified language", async () => {
    const tempDir = `${mkdtempSync(join(tmpdir(), "slidesk-test-"))}/`;
    writeFileSync(
      `${tempDir}en.lang.json`,
      JSON.stringify({ hello: "Hello EN" }),
    );
    writeFileSync(
      `${tempDir}fr.lang.json`,
      JSON.stringify({ default: true, hello: "Hello FR" }),
    );
    writeFileSync(`${tempDir}index.html`, "<html></html>");

    const result = await generateHTML(
      "<section>hello</section>",
      "<html>#SECTIONS#</html>",
      tempDir,
      { lang: "en" },
      {},
      [],
    );

    expect(result["index.html"]).toBeDefined();
    rmSync(tempDir, { recursive: true });
  });
});

describe("translations of a theme", () => {
  /** A talk whose files are `files`, paths relative to it, and its slides `$$a$$ $$b$$`. */
  const render = async (
    files: Record<string, object>,
    lang?: string,
  ): Promise<string> => {
    const dir = mkdtempSync(join(tmpdir(), "slidesk-test-"));
    try {
      for (const [file, json] of Object.entries(files)) {
        mkdirSync(join(dir, file, ".."), { recursive: true });
        writeFileSync(join(dir, file), JSON.stringify(json));
      }
      const result = await generateHTML(
        "<p>$$a$$ $$b$$</p>",
        "#SECTIONS#",
        dir,
        { lang },
        {},
        [],
      );
      return result["index.html"].content;
    } finally {
      rmSync(dir, { recursive: true });
    }
  };
  const t = (translations: Record<string, string>, isDefault = false) => ({
    default: isDefault,
    translations,
  });

  it("translates the keys of a theme in the language of the talk", async () => {
    const html = await render({
      "en.lang.json": t({ a: "hello" }),
      "fr.lang.json": t({ a: "bonjour" }, true),
      "themes/night/en.lang.json": t({ b: "night" }, true),
      "themes/night/fr.lang.json": t({ b: "nuit" }),
    });
    expect(html).toContain("<p>bonjour nuit</p>");
  });

  it("follows --lang", async () => {
    const html = await render(
      {
        "fr.lang.json": t({ a: "bonjour" }, true),
        "en.lang.json": t({ a: "hello" }),
        "themes/night/fr.lang.json": t({ b: "nuit" }, true),
        "themes/night/en.lang.json": t({ b: "night" }),
      },
      "en",
    );
    expect(html).toContain("<p>hello night</p>");
  });

  it("lets the talk override a key of its theme", async () => {
    const html = await render({
      "en.lang.json": t({ b: "mine" }, true),
      "themes/night/en.lang.json": t({ a: "theirs", b: "theirs" }, true),
    });
    expect(html).toContain("<p>theirs mine</p>");
  });

  it("falls back to the default of a theme without the language", async () => {
    const html = await render({
      "de.lang.json": t({ a: "hallo" }, true),
      "themes/night/en.lang.json": t({ b: "night" }, true),
    });
    expect(html).toContain("<p>hallo night</p>");
  });

  it("translates a talk without its own translation files", async () => {
    const files = {
      "themes/night/en.lang.json": t({ a: "hello" }, true),
      "themes/night/fr.lang.json": t({ a: "bonjour" }),
    };
    expect(await render(files)).toContain("<p>hello $$b$$</p>");
    expect(await render(files, "fr")).toContain("<p>bonjour $$b$$</p>");
  });

  it("lists the languages of the talk and of its themes", async () => {
    await expect(
      render(
        {
          "fr.lang.json": t({}, true),
          "themes/night/en.lang.json": t({}, true),
        },
        "xx",
      ),
    ).rejects.toThrow("xx.lang.json not found (available: en, fr)");
  });
});
