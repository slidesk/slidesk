import { describe, expect, it } from "bun:test";
import htmlToMarkdown from "./html";
import { parse } from "./scan";

const md = (html: string) => htmlToMarkdown(parse(html));

describe("htmlToMarkdown function", () => {
  it("should convert inline emphasis", () => {
    expect(md("<p>a <strong>b</strong> and <em>c</em></p>")).toBe(
      "a **b** and *c*",
    );
  });

  it("should convert links and inline code", () => {
    expect(md(`<p><a href="/x">go</a> <code>run()</code></p>`)).toBe(
      "[go](/x) `run()`",
    );
  });

  it("should clamp headings to level 3 and keep deeper ones", () => {
    expect(md("<h1>a</h1><h2>b</h2><h4>c</h4>")).toBe(
      "### a\n\n### b\n\n#### c",
    );
  });

  it("should convert nested lists", () => {
    expect(md("<ul><li>a</li><li>b<ul><li>b1</li></ul></li></ul>")).toBe(
      "- a\n- b\n  - b1",
    );
  });

  it("should number ordered lists", () => {
    expect(md("<ol><li>a</li><li>b</li></ol>")).toBe("1. a\n2. b");
  });

  it("should keep code blocks verbatim with their language", () => {
    expect(
      md(`<pre><code class="language-js">a = 1\n  b = 2</code></pre>`),
    ).toBe("```js\na = 1\n  b = 2\n```");
  });

  it("should convert images to the image directive", () => {
    expect(md(`<img src="a.png" alt="Un logo, sympa">`)).toBe(
      "!image(a.png, Un logo  sympa)",
    );
  });

  it("should convert tables", () => {
    expect(
      md(
        "<table><tr><th>a</th><th>b</th></tr><tr><td>1</td><td>2</td></tr></table>",
      ),
    ).toBe("| a | b |\n| --- | --- |\n| 1 | 2 |");
  });

  it("should convert blockquotes", () => {
    expect(md("<blockquote><p>cited</p></blockquote>")).toBe("> cited");
  });

  it("should decode entities", () => {
    expect(md("<p>Tom &amp; Jerry</p>")).toBe("Tom & Jerry");
  });

  it("should return an empty string for empty markup", () => {
    expect(md("<div>  </div>")).toBe("");
  });
});
