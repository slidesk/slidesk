import { describe, expect, it } from "bun:test";
import type { Page } from "../browser";
import notes from "./notes";

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
});
