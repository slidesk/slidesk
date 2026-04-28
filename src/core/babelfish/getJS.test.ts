import { describe, expect, it } from "bun:test";
import type { SliDeskPlugin } from "../../types";
import getJS from "./getJS";

describe("getJS function", () => {
  const defaultPlugins: SliDeskPlugin[] = [];

  it("should generate basic JS config", () => {
    const env = {};
    const result = getJS(defaultPlugins, env);
    expect(result).toContain("window.slidesk");
    expect(result).toContain("currentSlide: 0");
    expect(result).toContain('domain: "localhost"');
  });

  it("should include animation timer from env", () => {
    const result = getJS(defaultPlugins, { slidesk: { TRANSITION: 500 } });
    expect(result).toContain("animationTimer: 500");
  });

  it("should include env variables", () => {
    const result = getJS(defaultPlugins, { CUSTOM_VAR: "test" });
    expect(result).toContain('"CUSTOM_VAR":"test"');
  });

  it("should include plugin onSlideChange", () => {
    const plugins: SliDeskPlugin[] = [
      {
        name: "test",
        onSlideChange: "console.log('slide changed')",
        addRoutes: "",
        addWS: "",
        theme: "",
        addHTML: "",
        addHTMLFromFiles: [],
        addScripts: [],
        addStyles: [],
        addSpeakerScripts: [],
        addSpeakerStyles: [],
        onSpeakerViewSlideChange: "",
      },
    ];
    const result = getJS(plugins, {});
    expect(result).toContain("console.log('slide changed')");
  });
});
