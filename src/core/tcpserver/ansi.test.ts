import { describe, expect, it } from "bun:test";
import {
  ANSI,
  htmlToAnsi,
  IAC_ENABLE_CHAR_MODE,
  parseNAWS,
  stripTags,
  wrapText,
} from "./ansi";

describe("ANSI constants", () => {
  it("exposes escape sequences", () => {
    expect(ANSI.reset).toBe("\x1b[0m");
    expect(ANSI.clear).toBe("\x1b[2J\x1b[H");
    expect(ANSI.fg.bright.green).toBe("\x1b[92m");
    expect(ANSI.bg.bright.black).toBe("\x1b[100m");
  });

  it("builds a moveTo sequence", () => {
    expect(ANSI.moveTo(3, 7)).toBe("\x1b[3;7H");
  });

  it("exposes the telnet char mode negotiation buffer", () => {
    expect(IAC_ENABLE_CHAR_MODE).toBeInstanceOf(Buffer);
    expect([...IAC_ENABLE_CHAR_MODE]).toEqual([
      255, 251, 3, 255, 251, 1, 255, 253, 3, 255, 253, 31,
    ]);
  });
});

describe("parseNAWS", () => {
  it("reads cols and rows from a NAWS subnegotiation", () => {
    const data = Buffer.from([255, 250, 31, 0, 80, 0, 24, 255, 240]);
    expect(parseNAWS(data)).toEqual({ cols: 80, rows: 24 });
  });

  it("decodes multi byte sizes", () => {
    const data = Buffer.from([255, 250, 31, 1, 44, 0, 200, 255, 240]);
    expect(parseNAWS(data)).toEqual({ cols: 300, rows: 200 });
  });

  it("returns null when there is no NAWS sequence", () => {
    expect(parseNAWS(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]))).toBeNull();
  });

  it("returns null when the buffer is too short", () => {
    expect(parseNAWS(Buffer.from([255, 250, 31]))).toBeNull();
  });

  it("ignores a zeroed size and keeps scanning", () => {
    const data = Buffer.from([
      255, 250, 31, 0, 0, 0, 0, 255, 250, 31, 0, 90, 0, 30, 255, 240,
    ]);
    expect(parseNAWS(data)).toEqual({ cols: 90, rows: 30 });
  });
});

describe("stripTags", () => {
  it("removes every tag and trims", () => {
    expect(stripTags("  <p>hello <b>world</b></p> ")).toBe("hello world");
  });

  it("leaves plain text untouched", () => {
    expect(stripTags("plain")).toBe("plain");
  });
});

describe("htmlToAnsi", () => {
  it("drops head, script and style blocks", () => {
    const out = htmlToAnsi(
      "<head><title>t</title></head><script>var a=1;</script><style>p{color:red}</style>keep",
      20,
    );
    expect(out).not.toContain("var a=1");
    expect(out).not.toContain("color:red");
    expect(out).toContain("keep");
  });

  it("renders h1 uppercased between rules", () => {
    const out = htmlToAnsi("<h1>Title</h1>", 5);
    expect(out).toContain("TITLE");
    expect(out).toContain("=====");
  });

  it("renders h2 and h3", () => {
    expect(htmlToAnsi("<h2>Sub</h2>", 4)).toContain("| Sub");
    expect(htmlToAnsi("<h3>Third</h3>", 4)).toContain("* Third");
  });

  it("renders h4 to h6 as dashes", () => {
    expect(htmlToAnsi("<h4>Four</h4>", 4)).toContain("- Four");
    expect(htmlToAnsi("<h6>Six</h6>", 4)).toContain("- Six");
  });

  it("renders list items with a bullet", () => {
    const out = htmlToAnsi("<ul><li>one</li><li>two</li></ul>", 10);
    expect(out).toContain("one");
    expect(out).toContain("two");
    expect(out).toContain(">");
  });

  it("renders inline emphasis", () => {
    expect(htmlToAnsi("<strong>bold</strong>", 10)).toContain(
      `${ANSI.bold}bold${ANSI.reset}`,
    );
    expect(htmlToAnsi("<b>bold</b>", 10)).toContain(
      `${ANSI.bold}bold${ANSI.reset}`,
    );
    expect(htmlToAnsi("<em>it</em>", 10)).toContain(
      `${ANSI.italic}it${ANSI.reset}`,
    );
    expect(htmlToAnsi("<i>it</i>", 10)).toContain(
      `${ANSI.italic}it${ANSI.reset}`,
    );
  });

  it("renders inline code with a background", () => {
    const out = htmlToAnsi("<code>x=1</code>", 10);
    expect(out).toContain(ANSI.bg.bright.black);
    expect(out).toContain("x=1");
  });

  it("renders pre blocks inside a box", () => {
    const out = htmlToAnsi("<pre>line1\nline2</pre>", 10);
    expect(out).toContain("+--------+");
    expect(out).toContain("line1");
    expect(out).toContain("line2");
  });

  it("renders links with their href", () => {
    const out = htmlToAnsi('<a href="https://x.dev">site</a>', 20);
    expect(out).toContain("site");
    expect(out).toContain("(https://x.dev)");
  });

  it("renders horizontal rules and line breaks", () => {
    expect(htmlToAnsi("<hr/>", 3)).toContain("---");
    expect(htmlToAnsi("a<br/>b", 10)).toContain("a\r\nb");
  });

  it("renders paragraphs and divs", () => {
    expect(htmlToAnsi("<p>para</p>", 10)).toContain("para");
    expect(htmlToAnsi("<div>content</div>", 10)).toContain("content");
  });

  it("strips leftover tags", () => {
    expect(htmlToAnsi("<span>text</span>", 10)).toBe("text");
  });

  it("decodes html entities", () => {
    expect(htmlToAnsi("&amp;&lt;&gt;&quot;&apos;&nbsp;", 10)).toBe("&<>\"' ");
  });

  it("decodes numeric entities", () => {
    expect(htmlToAnsi("&#65;&#66;", 10)).toBe("AB");
  });
});

describe("wrapText", () => {
  it("leaves short lines untouched", () => {
    expect(wrapText("short", 20)).toBe("short");
  });

  it("wraps a long line on word boundaries", () => {
    expect(wrapText("aaa bbb ccc", 7)).toBe("aaa bbb\r\nccc");
  });

  it("ignores ansi escapes when measuring width", () => {
    const colored = `${ANSI.bold}aaa${ANSI.reset} bbb`;
    expect(wrapText(colored, 8)).toBe(colored);
  });

  it("keeps a word longer than the width on its own line", () => {
    expect(wrapText("tiny abcdefghij", 4)).toBe("tiny\r\nabcdefghij");
  });

  it("wraps each line of a multi line text", () => {
    expect(wrapText("aaa bbb\r\nccc ddd", 3)).toBe("aaa\r\nbbb\r\nccc\r\nddd");
  });
});
