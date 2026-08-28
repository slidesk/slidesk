import { describe, expect, it } from "bun:test";
import { parseSlides } from "./parse";

describe("parseSlides", () => {
  it("returns an empty index when there is no slide", () => {
    expect(parseSlides("<div>nothing here</div>")).toEqual({
      total: 0,
      list: [],
    });
  });

  it("extracts a slide and wraps its body in a section", () => {
    const res = parseSlides(
      '<section class="sd-slide" data-num="0"><p>hi</p></section>',
    );
    expect(res.total).toBe(1);
    expect(res.list[0].num).toBe(0);
    expect(res.list[0].content).toBe("<section><p>hi</p></section>");
  });

  it("sorts slides by their data-num", () => {
    const html =
      '<section class="sd-slide" data-num="2">two</section>' +
      '<section class="sd-slide" data-num="1">one</section>';
    const res = parseSlides(html);
    expect(res.list.map((s) => s.num)).toEqual([1, 2]);
    expect(res.list[0].content).toContain("one");
  });

  it("falls back to the insertion order when data-num is missing", () => {
    const html =
      '<section class="sd-slide">a</section>' +
      '<section class="sd-slide">b</section>';
    expect(parseSlides(html).list.map((s) => s.num)).toEqual([0, 1]);
  });

  it("ignores sections that are not slides", () => {
    expect(parseSlides('<section class="other">x</section>').total).toBe(0);
  });

  it("strips scripts, empty headings and trailing body tags", () => {
    const html =
      '<section class="sd-slide" data-num="0"><h2></h2>keep<script>evil()</script></body></html>';
    const content = parseSlides(html).list[0].content;
    expect(content).toContain("keep");
    expect(content).not.toContain("evil()");
    expect(content).not.toContain("<h2></h2>");
    expect(content).not.toContain("</body>");
  });

  it("handles single quoted and unquoted class attributes", () => {
    expect(parseSlides("<section class='sd-slide x'>a</section>").total).toBe(
      1,
    );
    expect(parseSlides("<section class=sd-slide>a</section>").total).toBe(1);
  });
});
