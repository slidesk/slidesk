import { describe, expect, it } from "bun:test";
import type { SliDeskConfig, SliDeskFavicon, SliDeskPlugin } from "../../types";
import prepareTPL from "./prepareTPL";

describe("prepareTPL function", () => {
  const defaultConfig: SliDeskConfig = {
    css: [],
    js: [],
  };

  const defaultFavicon: SliDeskFavicon = {
    name: "favicon.svg",
    content: "",
    type: "image/svg+xml",
  };

  it("should include default CSS", () => {
    const result = prepareTPL(defaultConfig, [], defaultFavicon, "/tmp");
    expect(result).toContain("slidesk.css");
  });

  it("should include default JS", () => {
    const result = prepareTPL(defaultConfig, [], defaultFavicon, "/tmp");
    expect(result).toContain("slidesk.js");
  });

  it("should include custom CSS from config", () => {
    const config: SliDeskConfig = {
      css: ['<link rel="stylesheet" href="custom.css" />'],
      js: [],
    };
    const result = prepareTPL(config, [], defaultFavicon, "/tmp");
    expect(result).toContain("custom.css");
  });

  it("should include custom JS from config", () => {
    const config: SliDeskConfig = {
      css: [],
      js: ['<script src="custom.js"></script>'],
    };
    const result = prepareTPL(config, [], defaultFavicon, "/tmp");
    expect(result).toContain("custom.js");
  });

  it("should include favicon", () => {
    const result = prepareTPL(defaultConfig, [], defaultFavicon, "/tmp");
    expect(result).toContain("favicon.svg");
  });

  it("should include favicon type", () => {
    const result = prepareTPL(defaultConfig, [], defaultFavicon, "/tmp");
    expect(result).toContain("image/svg+xml");
  });

  it("should include plugin styles", () => {
    const plugins: SliDeskPlugin[] = [
      {
        name: "test",
        addStyles: ["/style.css"],
        addRoutes: "",
        addWS: "",
        theme: "",
        addHTML: "",
        addHTMLFromFiles: [],
        addScripts: [],
        addSpeakerScripts: [],
        addSpeakerStyles: [],
        onSlideChange: "",
        onSpeakerViewSlideChange: "",
      },
    ];
    const result = prepareTPL(defaultConfig, plugins, defaultFavicon, "/tmp");
    expect(result).toContain("style.css");
  });

  it("should include plugin scripts", () => {
    const plugins: SliDeskPlugin[] = [
      {
        name: "test",
        addScripts: ["/script.js"],
        addRoutes: "",
        addWS: "",
        theme: "",
        addHTML: "",
        addHTMLFromFiles: [],
        addStyles: [],
        addSpeakerScripts: [],
        addSpeakerStyles: [],
        onSlideChange: "",
        onSpeakerViewSlideChange: "",
      },
    ];
    const result = prepareTPL(defaultConfig, plugins, defaultFavicon, "/tmp");
    expect(result).toContain("script.js");
  });

  it("should include plugin script modules", () => {
    const plugins: SliDeskPlugin[] = [
      {
        name: "test",
        addScriptModules: ["/module.js"],
        addRoutes: "",
        addWS: "",
        theme: "",
        addHTML: "",
        addHTMLFromFiles: [],
        addScripts: [],
        addStyles: [],
        addSpeakerScripts: [],
        addSpeakerStyles: [],
        onSlideChange: "",
        onSpeakerViewSlideChange: "",
      },
    ];
    const result = prepareTPL(defaultConfig, plugins, defaultFavicon, "/tmp");
    expect(result).toContain('type="module"');
  });
});
