import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import includes from "./includes";

// includes only follows files under the working directory
const scratch = join(process.cwd(), ".tmp-includes");

afterEach(() => {
  rmSync(scratch, { recursive: true, force: true });
});

const talk = (files: Record<string, string>) => {
  mkdirSync(scratch, { recursive: true });
  for (const [name, content] of Object.entries(files))
    writeFileSync(join(scratch, name), content);
};

const fixture = join(import.meta.dir, "../../__fixtures__/talk");

describe("includes function", () => {
  it("should return empty string when file path is outside cwd", async () => {
    const result = await includes("/outside/path/file.sdf");
    expect(result).toBe("");
  });

  it("reads a file that has no include directive", async () => {
    const result = await includes(`${fixture}/slides/01-intro.sdf`);
    expect(result).toContain("## Intro");
    expect(result).toContain("Hello **world**");
  });

  it("expands a directory include with the default extensions", async () => {
    const result = await includes(`${fixture}/main.sdf`);
    expect(result).toContain("## Intro");
    expect(result).toContain("## More");
  });

  it("restricts a directory include to the given extensions", async () => {
    const result = await includes(`${fixture}/only-md.sdf`);
    expect(result).toContain("## More");
    expect(result).not.toContain("## Intro");
  });

  it("expands an include pointing at a single file", async () => {
    const result = await includes(`${fixture}/single-include.sdf`);
    expect(result).toContain("## Intro");
    expect(result).not.toContain("## More");
  });

  it("reports a file including itself instead of looping", async () => {
    talk({ "main.md": "# T\n\n!include(.)\n" });
    expect(includes(join(scratch, "main.md"))).rejects.toThrow(
      "!include loop: .tmp-includes/main.md → .tmp-includes/main.md",
    );
  });

  it("reports files including each other", async () => {
    talk({ "a.md": "\n!include(b.md)\n", "b.md": "\n!include(a.md)\n" });
    expect(includes(join(scratch, "a.md"))).rejects.toThrow("!include loop");
  });

  it("reports an include that does not exist", async () => {
    talk({ "main.md": "# T\n\n!include(missing.md)\n" });
    expect(includes(join(scratch, "main.md"))).rejects.toThrow(
      "!include(missing.md) in .tmp-includes/main.md: missing.md not found",
    );
  });

  it("includes the same file twice when it is not a loop", async () => {
    talk({
      "main.md": "\n!include(part.md)\n!include(part.md)\n",
      "part.md": "## Part\n",
    });
    const result = await includes(join(scratch, "main.md"));
    expect(result.match(/## Part/g)).toHaveLength(2);
  });

  it("keeps the slides of CRLF files apart", async () => {
    talk({
      "main.md": "## Welcome\r\n\r\n!include(part.md)\r\n",
      "part.md": "## Part\r\n\r\nBody\r\n",
    });
    const result = await includes(join(scratch, "main.md"));
    expect(result).not.toContain("\r");
    expect(result.split("\n## ")).toHaveLength(2);
  });

  it("leaves a directive shown in a code block as text", async () => {
    talk({
      "main.md":
        "## Code\n\n```markdown\n!include(part.md)\n```\n\n!include(part.md)\n",
      "part.md": "## Part\n",
    });
    const result = await includes(join(scratch, "main.md"));
    expect(result).toContain("```markdown\n!include(part.md)\n```");
    expect(result.match(/## Part/g)).toHaveLength(1);
  });

  it("treats an unclosed code block as running to the end", async () => {
    talk({ "main.md": "~~~\n!include(missing.md)\n" });
    expect(await includes(join(scratch, "main.md"))).toContain(
      "!include(missing.md)",
    );
  });
});
