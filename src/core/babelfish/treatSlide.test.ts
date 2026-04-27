import { describe, expect, it } from "bun:test";
import treatSlide from "./treatSlide";

describe("treatSlide function", () => {
  it("should return empty string for empty slide", async () => {
    const result = await treatSlide("", 0, {}, []);
    expect(result).toBe("");
  });

  it("should render markdown content", async () => {
    const result = await treatSlide("# Hello", 0, {}, []);
    expect(result).toContain("<h1>Hello</h1>");
  });

  it("should add slide number", async () => {
    const result = await treatSlide("# Hello", 5, {}, []);
    expect(result).toContain('data-num="5"');
  });

  it("should extract title classes", async () => {
    const result = await treatSlide("## Title.[custom-class]", 0, {}, []);
    expect(result).toContain("custom-class");
  });

  it("should handle template syntax", async () => {
    const result = await treatSlide("## Title.[#mytemplate]", 0, {}, []);
    expect(result).toContain("sd-slide");
  });

  it("should include timer data when enabled", async () => {
    const result = await treatSlide("# Hello\n//@[]5min", 0, {}, []);
    expect(result).toContain("timer-slide");
  });

  it("should handle checkpoint timer", async () => {
    const result = await treatSlide("# Hello\n//@<checkpoint", 0, {}, []);
    expect(result).toContain("timer-checkpoint");
  });

  it("should handle source plugin", async () => {
    const plugins = [
      {
        name: "source",
        addRoutes: "",
        addWS: "",
        addHTML: "",
        addHTMLFromFiles: {},
        addScripts: [],
        addStyles: [],
        addSpeakerScripts: [],
        addSpeakerStyles: [],
        onSlideChange: "",
        onSpeakerViewSlideChange: "",
        theme: "",
      },
    ];
    const result = await treatSlide("# Hello", 0, {}, plugins);
    expect(result).toContain("data-source");
  });

  it("should filter out classes starting with #", async () => {
    const result = await treatSlide(
      "## Title.[#template custom-class]",
      0,
      {},
      [],
    );
    expect(result).toContain("custom-class");
    expect(result).not.toContain("#template");
  });

  it("should apply template when found", async () => {
    const templates = { mytemplate: "<div>{{content}}</div>" };
    const result = await treatSlide("## Title.[#mytemplate]", 0, templates, []);
    expect(result).toContain("<div>");
  });
});
