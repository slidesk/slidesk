import { describe, expect, it } from "bun:test";
import type { BunSocket, SliDeskTelnetSession } from "../../types";
import { ANSI } from "./ansi";
import { fetchSlideHtml, renderSlide, renderStatusBar } from "./session";

const fakeSocket = () => {
  const writes: string[] = [];
  const socket = {
    write: (data: Buffer) => {
      writes.push(data.toString("utf8"));
      return data.length;
    },
  } as unknown as BunSocket;
  return { socket, writes };
};

const makeSession = (
  overrides: Partial<SliDeskTelnetSession> = {},
): SliDeskTelnetSession =>
  ({
    currentSlide: 0,
    totalSlides: 2,
    rows: 6,
    cols: 40,
    loading: false,
    started: true,
    config: { slides: ["<p>first</p>", "<p>second</p>"] },
    ...overrides,
  }) as SliDeskTelnetSession;

describe("fetchSlideHtml", () => {
  it("returns the html of the current slide", () => {
    expect(fetchSlideHtml(makeSession())).toBe("<p>first</p>");
    expect(fetchSlideHtml(makeSession({ currentSlide: 1 }))).toBe(
      "<p>second</p>",
    );
  });

  it("returns an error slide when the slide is missing", () => {
    const html = fetchSlideHtml(makeSession({ currentSlide: 9 }));
    expect(html).toContain("Loading error");
    expect(html).toContain("Slide not found");
  });
});

describe("renderStatusBar", () => {
  it("draws the shortcuts and the slide counter on the last row", () => {
    const { socket, writes } = fakeSocket();
    renderStatusBar(socket, makeSession({ currentSlide: 1, totalSlides: 3 }));
    const out = writes[0];
    expect(out.startsWith(ANSI.moveTo(6, 1))).toBe(true);
    expect(out).toContain("Navigate");
    expect(out).toContain("Slide 2 / 3");
  });

  it("does not overflow when the terminal is narrow", () => {
    const { socket, writes } = fakeSocket();
    renderStatusBar(socket, makeSession({ cols: 5 }));
    expect(writes[0]).toContain("Slide 1 / 2");
  });
});

describe("renderSlide", () => {
  it("renders the slide content and the status bar", async () => {
    const { socket, writes } = fakeSocket();
    const session = makeSession();
    await renderSlide(socket, session);
    const out = writes.join("");
    expect(out).toContain("Loading...");
    expect(out).toContain("first");
    expect(out).toContain("Slide 1 / 2");
    expect(out).toContain(ANSI.hideCursor);
    expect(out).toContain(ANSI.showCursor);
    expect(session.loading).toBe(false);
  });

  it("does nothing while another render is in flight", async () => {
    const { socket, writes } = fakeSocket();
    await renderSlide(socket, makeSession({ loading: true }));
    expect(writes).toEqual([]);
  });

  it("truncates the content to the available rows", async () => {
    const { socket, writes } = fakeSocket();
    const slide = `<p>${["a", "b", "c", "d", "e", "f"].join("</p><p>")}</p>`;
    await renderSlide(
      socket,
      makeSession({ rows: 4, config: { slides: [slide] }, totalSlides: 1 }),
    );
    const rendered = writes.join("");
    expect(rendered).toContain("Slide 1 / 1");
    expect(rendered).not.toContain("f");
  });
});
