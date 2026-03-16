import { describe, expect, it } from "bun:test";
import type { SliDeskPlugin } from "../../types";
import polish from "./polish";

describe("polish function", () => {
  it("should replace #TITLE# with env TITLE", async () => {
    const template =
      "<html><head><title>#TITLE#</title></head><body>#SECTIONS#</body></html>";
    const presentation = "<p>Slide content</p>";
    const env = { TITLE: "My Presentation" };
    const plugins: SliDeskPlugin[] = [];

    const result = await polish(presentation, template, env, plugins);
    expect(result).toContain("My Presentation");
  });

  it("should extract title from h1 if no env TITLE", async () => {
    const template =
      "<html><head><title>#TITLE#</title></head><body>#SECTIONS#</body></html>";
    const presentation = "<h1>Extracted Title</h1><p>Slide content</p>";
    const env = {};
    const plugins: SliDeskPlugin[] = [];

    const result = await polish(presentation, template, env, plugins);
    expect(result).toContain("Extracted Title");
  });

  it("should use default title SliDesk if no title found", async () => {
    const template =
      "<html><head><title>#TITLE#</title></head><body>#SECTIONS#</body></html>";
    const presentation = "<p>Slide content</p>";
    const env = {};
    const plugins: SliDeskPlugin[] = [];

    const result = await polish(presentation, template, env, plugins);
    expect(result).toContain("<title>SliDesk</title>");
  });

  it("should replace #SECTIONS# with presentation", async () => {
    const template = "<html><body>#SECTIONS#</body></html>";
    const presentation = "<p>Slide content</p>";
    const env = {};
    const plugins: SliDeskPlugin[] = [];

    const result = await polish(presentation, template, env, plugins);
    expect(result).toContain("<p>Slide content</p>");
  });

  it("should add plugin HTML", async () => {
    const template = "<html><body>#SECTIONS#</body></html>";
    const presentation = "<p>Slide</p>";
    const env = {};
    const plugins: SliDeskPlugin[] = [
      {
        name: "test-plugin",
        addHTML: '<script src="test.js"></script>',
        addRoutes: "",
        addWS: "",
        theme: "",
        addHTMLFromFiles: [],
        addScripts: [],
        addStyles: [],
        addSpeakerScripts: [],
        addSpeakerStyles: [],
        onSlideChange: "",
        onSpeakerViewSlideChange: "",
      },
    ];

    const result = await polish(presentation, template, env, plugins);
    expect(result).toContain('<script src="test.js"></script>');
  });

  it("should add HTML from addHTMLFromFiles", async () => {
    const template = "<html><body>#SECTIONS#</body></html>";
    const presentation = "<p>Slide</p>";
    const env = {};
    const plugins: SliDeskPlugin[] = [
      {
        name: "test-plugin",
        addHTML: "",
        addHTMLFromFiles: { "test.html": "<script>test</script>" },
        addRoutes: "",
        addWS: "",
        theme: "",
        addScripts: [],
        addStyles: [],
        addSpeakerScripts: [],
        addSpeakerStyles: [],
        onSlideChange: "",
        onSpeakerViewSlideChange: "",
      },
    ];

    const result = await polish(presentation, template, env, plugins);
    expect(result).toContain("<script>test</script>");
  });

  it("should minify the HTML output", async () => {
    const template = "<html><body>  #SECTIONS#  </body></html>";
    const presentation = "<p>Slide</p>";
    const env = {};
    const plugins: SliDeskPlugin[] = [];

    const result = await polish(presentation, template, env, plugins);
    expect(result).not.toContain("  ");
  });
});
