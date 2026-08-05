import { describe, expect, it } from "bun:test";
import scan, { attr, unescapeXML } from "./scan";

describe("scan function", () => {
  it("should collect elements in document order", () => {
    const found = scan("<r><a>1</a><b>2</b><a>3</a></r>", ["a", "b"]);
    expect(found.map((e) => `${e.name}:${e.inner}`)).toEqual([
      "a:1",
      "b:2",
      "a:3",
    ]);
  });

  it("should descend into non-matching elements", () => {
    const found = scan("<r><wrap><a>deep</a></wrap></r>", ["a"]);
    expect(found).toHaveLength(1);
    expect(found[0].inner).toBe("deep");
  });

  it("should keep nested same-name elements inside the outer one", () => {
    const found = scan("<a>outer<a>inner</a></a>", ["a"]);
    expect(found).toHaveLength(1);
    expect(found[0].inner).toBe("outer<a>inner</a>");
  });

  it("should handle self-closing elements", () => {
    const found = scan(`<r><img src="a.png"/><p>x</p></r>`, ["img", "p"]);
    expect(found.map((e) => e.name)).toEqual(["img", "p"]);
    expect(found[0].inner).toBe("");
  });

  it("should treat html void tags as self-closing", () => {
    const found = scan("a<br>b<p>x</p>", ["br", "p"]);
    expect(found.map((e) => e.name)).toEqual(["br", "p"]);
    expect(found[1].inner).toBe("x");
  });

  it("should not look inside an element it already matched", () => {
    const found = scan("<p>a<br>b</p>", ["br", "p"]);
    expect(found.map((e) => e.name)).toEqual(["p"]);
    expect(found[0].inner).toBe("a<br>b");
  });

  it("should ignore angle brackets inside attributes", () => {
    const found = scan(`<a title="1 > 0">x</a>`, ["a"]);
    expect(found).toHaveLength(1);
    expect(found[0].inner).toBe("x");
  });

  it("should skip comments and processing instructions", () => {
    const found = scan(
      `<?xml version="1.0"?><r><!-- <a>no</a> --><a>yes</a></r>`,
      ["a"],
    );
    expect(found.map((e) => e.inner)).toEqual(["yes"]);
  });

  it("should return nothing when the name is absent", () => {
    expect(scan("<r><b>1</b></r>", ["a"])).toHaveLength(0);
  });
});

describe("attr function", () => {
  it("should read a double quoted attribute", () => {
    expect(attr(' type="title" idx="1"', "type")).toBe("title");
  });

  it("should read a single quoted attribute", () => {
    expect(attr(" type='body'", "type")).toBe("body");
  });

  it("should not match an attribute suffix", () => {
    expect(attr(' data-type="x"', "type")).toBeNull();
  });

  it("should return null when absent", () => {
    expect(attr(' idx="1"', "type")).toBeNull();
  });
});

describe("unescapeXML function", () => {
  it("should decode named entities", () => {
    expect(unescapeXML("Tom &amp; &lt;Jerry&gt; &quot;x&quot;")).toBe(
      `Tom & <Jerry> "x"`,
    );
  });

  it("should decode numeric entities", () => {
    expect(unescapeXML("&#233;&#x2014;")).toBe("é—");
  });

  it("should leave unknown entities untouched", () => {
    expect(unescapeXML("&unknown;")).toBe("&unknown;");
  });
});
