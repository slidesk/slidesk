import { describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import generateHTML from "./generateHTML";

describe("generateHTML function", () => {
  it("should generate HTML without translations", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
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
    const tempDir = mkdtempSync(tmpdir()) + "/";
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

  it("should use specified language", async () => {
    const tempDir = mkdtempSync(tmpdir()) + "/";
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
