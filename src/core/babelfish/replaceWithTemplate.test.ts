import { describe, expect, it } from "bun:test";
import replaceWithTemplate from "./replaceWithTemplate";

describe("replaceWithTemplate function", () => {
  const templates: { [key: string]: string } = {
    mytemplate: "<div><sd-title /><sd-content /></div>",
    othertemplate: "<div><sd-title /> - <sd-content /></div>",
    withsection: "<div><sd-title /><sd-section /></div>",
  };

  it("should replace title placeholder", () => {
    const result = replaceWithTemplate(
      "mytemplate",
      "<h2>Test Title</h2><p>Content</p>",
      "Test Title",
      templates,
    );
    expect(result).toContain("<h2>Test Title</h2>");
  });

  it("should replace content placeholder", () => {
    const result = replaceWithTemplate(
      "mytemplate",
      "<h2>Title</h2><p>Test Content</p>",
      "Title",
      templates,
    );
    expect(result).toContain("Test Content");
  });

  it("should handle custom blocs", () => {
    const content =
      "<h2>Title</h2><p>[[section]]</p>Section Content<p>[[/section]]</p>";
    const result = replaceWithTemplate(
      "withsection",
      content,
      "Title",
      templates,
    );
    expect(result).toContain("Section Content");
  });

  it("should remove unused sd tags", () => {
    const result = replaceWithTemplate(
      "mytemplate",
      "<h2>Title</h2><p>Content</p>",
      "Title",
      templates,
    );
    expect(result).not.toContain("<sd-");
  });
});
