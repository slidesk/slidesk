import { describe, expect, it } from "bun:test";
import slidev from "./slidev";

describe("slidev function", () => {
  it("should read the deck title from the headmatter", () => {
    const deck = slidev("---\ntitle: My deck\n---\n\n# One\n");
    expect(deck.title).toBe("My deck");
  });

  it("should fall back to the first slide title", () => {
    expect(slidev("# One\n\ntext\n").title).toBe("One");
  });

  it("should split slides on a bare separator", () => {
    const deck = slidev("# One\n\n---\n\n# Two\n\n---\n\n# Three\n");
    expect(deck.slides.map((s) => s.title)).toEqual(["One", "Two", "Three"]);
  });

  it("should not split on a separator inside a code fence", () => {
    const deck = slidev("# One\n\n```yaml\na: 1\n---\nb: 2\n```\n");
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].content).toContain("---");
  });

  it("should turn layout and class frontmatter into classes", () => {
    const deck = slidev(
      "# One\n\n---\nlayout: center\nclass: dense\n---\n\n# Two\n",
    );
    expect(deck.slides[1].classes).toEqual(["center", "dense"]);
  });

  it("should extract the trailing html comment as notes", () => {
    const deck = slidev("# One\n\nbody\n\n<!--\nmy note\n-->\n");
    expect(deck.slides[0].notes).toBe("my note");
    expect(deck.slides[0].content).toBe("body");
  });

  it("should keep the body without its title heading", () => {
    const deck = slidev("# One\n\n- a\n- b\n");
    expect(deck.slides[0].content).toBe("- a\n- b");
  });

  it("should drop slides that are entirely empty", () => {
    const deck = slidev("# One\n\n---\n\n\n---\n\n# Two\n");
    expect(deck.slides.map((s) => s.title)).toEqual(["One", "Two"]);
  });

  it("should reject a file with no slide", () => {
    expect(() => slidev("")).toThrow("no slide found");
  });
});
