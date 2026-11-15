import { describe, expect, it } from "bun:test";
import type { Page } from "../browser";
import notes, { addNotesPages, notesHtml, notesShot } from "./notes";

describe("notes", () => {
  it("returns the notes extracted from the page", async () => {
    const page = {
      evaluate: async () => ["first note", "", "third note"],
    } as unknown as Page;
    expect(await notes(page)).toEqual(["first note", "", "third note"]);
  });

  it("reads the speaker asides of every slide", async () => {
    let expression = "";
    const page = {
      evaluate: async (expr: string) => {
        expression = expr;
        return [];
      },
    } as unknown as Page;
    await notes(page);
    expect(expression).toContain("aside.sd-notes");
    expect(expression).toContain(".sd-slide");
    expect(expression).toContain("atob");
    expect(expression).toContain("decodeURIComponent");
  });

  it("adds a notes page after the last step of each slide that has notes", async () => {
    let expression = "";
    const page = {
      evaluate: async (expr: string) => {
        expression = expr;
      },
    } as unknown as Page;
    await addNotesPages(page);
    expect(expression).toContain(".sd-slide:not([data-sd-step])");
    expect(expression).toContain('hasAttribute("data-sd-step")');
    expect(expression).toContain("sd-export-notes");
    expect(expression).toContain("if (!html.trim()) return;");
  });
});

describe("notesShot", () => {
  it("lays the notes over the slide, captures them in jpeg, then removes them", async () => {
    const evaluated: string[] = [];
    let format: string | undefined;
    const page = {
      evaluate: async (expression: string) => {
        evaluated.push(expression);
      },
      screenshot: async (f?: string) => {
        format = f;
        return new Uint8Array([1]);
      },
    } as unknown as Page;
    expect([...(await notesShot(page, '<p>a "quote"</p>'))]).toEqual([1]);
    expect(format).toBe("jpeg");
    expect(evaluated[0]).toContain(JSON.stringify('<p>a "quote"</p>'));
    expect(evaluated[1]).toContain(
      'getElementById("sd-export-notes").remove()',
    );
  });
});

describe("notesHtml", () => {
  it("returns the decoded notes of each slide", async () => {
    let expression = "";
    const page = {
      evaluate: async (e: string) => {
        expression = e;
        return ["<p>a</p>"];
      },
    } as unknown as Page;
    expect(await notesHtml(page)).toEqual(["<p>a</p>"]);
    expect(expression).toContain("decodeURIComponent");
  });
});
