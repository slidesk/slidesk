import { describe, expect, it } from "bun:test";
import progress, { bar } from "./progress";

const fakeOut = (isTTY: boolean) => {
  const written: string[] = [];
  return {
    written,
    write: (text: string) => {
      written.push(text);
    },
    isTTY,
  };
};

describe("bar function", () => {
  it("should draw an empty bar at the start", () => {
    expect(bar(0, 4, 4)).toBe("░░░░ 0/4");
  });

  it("should draw a full bar once done", () => {
    expect(bar(4, 4, 4)).toBe("████ 4/4");
  });

  it("should fill proportionally", () => {
    expect(bar(1, 4, 4)).toBe("█░░░ 1/4");
    expect(bar(3, 4, 4)).toBe("███░ 3/4");
  });

  it("should clamp out of range values", () => {
    expect(bar(-1, 4, 4)).toBe("░░░░ -1/4");
    expect(bar(9, 4, 4)).toBe("████ 9/4");
  });

  it("should stay full without any total", () => {
    expect(bar(0, 0, 4)).toBe("████ 0/0");
  });
});

describe("progress function", () => {
  it("should redraw the bar in place on a tty", () => {
    const out = fakeOut(true);
    const p = progress(2, out);
    p.update(1);
    p.update(2);
    expect(out.written).toEqual([`\r   ${bar(1, 2)}`, `\r   ${bar(2, 2)}`]);
  });

  it("should end the line on stop", () => {
    const out = fakeOut(true);
    const p = progress(2, out);
    p.update(1);
    p.stop();
    expect(out.written.at(-1)).toBe("\n");
  });

  it("should not end a line it never drew", () => {
    const out = fakeOut(true);
    progress(2, out).stop();
    expect(out.written).toEqual([]);
  });

  it("should end the line only once", () => {
    const out = fakeOut(true);
    const p = progress(2, out);
    p.update(1);
    p.stop();
    p.stop();
    expect(out.written.filter((text) => text === "\n")).toHaveLength(1);
  });

  it("should stay quiet outside a tty", () => {
    const out = fakeOut(false);
    const p = progress(2, out);
    p.update(1);
    p.stop();
    expect(out.written).toEqual([]);
  });
});
