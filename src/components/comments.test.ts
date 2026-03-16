import { describe, expect, it } from "bun:test";
import comments from "./comments";

describe("comments function", () => {
  it("should encode content properly", () => {
    const input = `---
title: Test
---
/*
note content
*/`;
    const result = comments(input);
    expect(result).toContain("<aside");
    expect(result).toContain("sd-notes");
  });

  it("should handle multiple comments", () => {
    const input = `---
title: Test
---
/*
comment 1
*/
/*
comment 2
*/`;
    const result = comments(input);
    const matches = result.match(/<aside/g);
    expect(matches).toHaveLength(2);
  });

  it("should not modify content without comments", () => {
    const input = "Regular content without comments";
    const result = comments(input);
    expect(result).toBe("Regular content without comments");
  });
});
