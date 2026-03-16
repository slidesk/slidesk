import { describe, expect, it } from "bun:test";
import type { SliDeskPlugin } from "../../types";
import getNotesJS from "./getNotesJS";

describe("getNotesJS function", () => {
  it("should generate basic notes JS config", () => {
    const result = getNotesJS([]);
    expect(result).toContain("window.slidesk");
  });

  it("should include timer elements", () => {
    const result = getNotesJS([]);
    expect(result).toContain("#sd-sv-timer");
    expect(result).toContain("#sd-sv-subtimer");
  });

  it("should include WebSocket", () => {
    const result = getNotesJS([]);
    expect(result).toContain("WebSocket");
  });

  it("should include plugin onSpeakerViewSlideChange", () => {
    const plugins: SliDeskPlugin[] = [
      {
        name: "test",
        onSpeakerViewSlideChange: "console.log('speaker changed')",
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
      },
    ];
    const result = getNotesJS(plugins);
    expect(result).toContain("console.log('speaker changed')");
  });
});
