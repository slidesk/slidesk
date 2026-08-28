import { afterEach, describe, expect, it, spyOn } from "bun:test";
import gslides, { presentationId } from "./gslides";

let fetchSpy: ReturnType<typeof spyOn> | undefined;

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = undefined;
});

const stubFetch = (responder: (url: string) => Response) => {
  const urls: string[] = [];
  fetchSpy = spyOn(globalThis, "fetch").mockImplementation(((url: string) => {
    urls.push(url);
    return Promise.resolve(responder(url));
  }) as never);
  return urls;
};

describe("presentationId", () => {
  it("reads the id of a regular presentation url", () => {
    expect(
      presentationId("https://docs.google.com/presentation/d/abc-123_X/edit"),
    ).toBe("abc-123_X");
  });

  it("reads the id of a published presentation url", () => {
    expect(
      presentationId("https://docs.google.com/presentation/d/e/pub-42/pub"),
    ).toBe("pub-42");
  });

  it("returns null for an unrelated url", () => {
    expect(presentationId("https://example.com/deck")).toBeNull();
  });
});

describe("gslides", () => {
  it("downloads the pptx export of the presentation", async () => {
    const urls = stubFetch(
      () =>
        new Response(new Uint8Array([80, 75, 3, 4]), {
          headers: { "content-type": "application/vnd.openxmlformats" },
        }),
    );
    const data = await gslides(
      "https://docs.google.com/presentation/d/deck9/edit",
    );
    expect(urls).toEqual([
      "https://docs.google.com/presentation/d/deck9/export/pptx",
    ]);
    expect([...data]).toEqual([80, 75, 3, 4]);
  });

  it("rejects a url without a presentation id", () => {
    expect(gslides("https://example.com/nope")).rejects.toThrow(
      "no Google Slides presentation id found",
    );
  });

  it("rejects a presentation that is not shared", () => {
    stubFetch(
      () =>
        new Response("<html>sign in</html>", {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    );
    expect(
      gslides("https://docs.google.com/presentation/d/private/edit"),
    ).rejects.toThrow("anyone with the link");
  });

  it("rejects a failed download", () => {
    stubFetch(() => new Response("", { status: 500 }));
    expect(
      gslides("https://docs.google.com/presentation/d/deck9/edit"),
    ).rejects.toThrow("unable to download");
  });
});
