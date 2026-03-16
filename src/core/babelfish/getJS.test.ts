import { describe, expect, it } from "bun:test";
import type { SliDeskPlugin } from "../../types";
import getJS from "./getJS";

describe("getJS function", () => {
  const defaultPlugins: SliDeskPlugin[] = [];

  it("should generate basic JS config", () => {
    const options = { domain: "localhost" };
    const result = getJS(options, defaultPlugins, {});
    expect(result).toContain("window.slidesk");
    expect(result).toContain("currentSlide: 0");
  });

  it("should include animation timer from env", () => {
    const options = { domain: "localhost" };
    const result = getJS(options, defaultPlugins, { ANIMATION_TIMER: "500" });
    expect(result).toContain("animationTimer: 500");
  });

  it("should include animation timer from options", () => {
    const options = { domain: "localhost", transition: "400" };
    const result = getJS(options, defaultPlugins, {});
    expect(result).toContain("animationTimer: 400");
  });

  it("should include domain in config", () => {
    const options = { domain: "example.com" };
    const result = getJS(options, defaultPlugins, {});
    expect(result).toContain('domain: "example.com"');
  });

  it("should include env variables", () => {
    const options = { domain: "localhost" };
    const result = getJS(options, defaultPlugins, { CUSTOM_VAR: "test" });
    expect(result).toContain('"CUSTOM_VAR":"test"');
  });

  it("should add WebSocket for non-save mode", () => {
    const options = { domain: "localhost" };
    const result = getJS(options, defaultPlugins, {});
    expect(result).toContain("WebSocket");
  });

  it("should add save flag for save mode", () => {
    const options = { domain: "localhost", save: "output" };
    const result = getJS(options, defaultPlugins, {});
    expect(result).toContain("window.slidesk.save = true");
  });

  it("should include plugin onSlideChange", () => {
    const options = { domain: "localhost" };
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
    const result = getJS(options, plugins, {});
    expect(result).toContain("console.log('slide changed')");
  });
});
