import { describe, expect, it } from "bun:test";
import type { SliDeskConfig, SliDeskPlugin } from "../../types";
import getNotesView from "./getNotesView";

describe("getNotesView function", () => {
  const defaultConfig: SliDeskConfig = {
    customCSS: "",
    customIncludes: { css: [], js: [] },
  };

  it("should include default CSS", () => {
    const result = getNotesView(defaultConfig, []);
    expect(result).toContain("slidesk.css");
    expect(result).toContain("slidesk-notes.css");
  });

  it("should include default JS", () => {
    const result = getNotesView(defaultConfig, []);
    expect(result).toContain("slidesk-notes.js");
  });

  it("should include custom CSS from config", () => {
    const config: SliDeskConfig = {
      customCSS: '<link rel="stylesheet" href="custom.css" />',
      customIncludes: { css: [], js: [] },
    };
    const result = getNotesView(config, []);
    expect(result).toContain("custom.css");
  });

  it("should include custom includes CSS", () => {
    const config: SliDeskConfig = {
      customCSS: "",
      customIncludes: { css: ["<link href='/style.css' />"], js: [] },
    };
    const result = getNotesView(config, []);
    expect(result).toContain("/style.css");
  });

  it("should include plugin speaker styles", () => {
    const plugins: SliDeskPlugin[] = [
      {
        name: "test",
        addSpeakerStyles: ["/speaker-style.css"],
        addRoutes: "",
        addWS: "",
        theme: "",
        addHTML: "",
        addHTMLFromFiles: [],
        addScripts: [],
        addStyles: [],
        addSpeakerScripts: [],
        onSlideChange: "",
        onSpeakerViewSlideChange: "",
      },
    ];
    const result = getNotesView(defaultConfig, plugins);
    expect(result).toContain("speaker-style.css");
  });

  it("should include plugin speaker scripts", () => {
    const plugins: SliDeskPlugin[] = [
      {
        name: "test",
        addSpeakerScripts: ["/speaker-script.js"],
        addRoutes: "",
        addWS: "",
        theme: "",
        addHTML: "",
        addHTMLFromFiles: [],
        addScripts: [],
        addStyles: [],
        addSpeakerStyles: [],
        onSlideChange: "",
        onSpeakerViewSlideChange: "",
      },
    ];
    const result = getNotesView(defaultConfig, plugins);
    expect(result).toContain("speaker-script.js");
  });
});
