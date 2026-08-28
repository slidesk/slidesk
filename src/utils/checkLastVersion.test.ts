import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { captured } from "../__testing__/console";
import checkVersion from "./checkLastVersion";

const RELEASES_URL =
  "https://api.github.com/repos/slidesk/slidesk/releases/latest";

const spies: ReturnType<typeof spyOn>[] = [];

const stubFetch = (impl: (url: string) => Promise<Response>) => {
  const spy = spyOn(globalThis, "fetch").mockImplementation(((url: string) =>
    impl(url)) as never);
  spies.push(spy);
  return spy;
};

const captureConsole = () => {
  captured.clear();
  return { warns: captured.warns, errors: captured.errors };
};

afterEach(() => {
  for (const spy of spies.splice(0)) spy.mockRestore();
});

describe("checkVersion", () => {
  it("warns when a newer release is published", async () => {
    const { warns } = captureConsole();
    stubFetch(async () => Response.json({ tag_name: "2.20.0" }));
    await checkVersion("2.19.0");
    expect(warns).toHaveLength(1);
    expect(JSON.stringify(warns[0])).toContain(
      "SliDesk is out of date! Please update to 2.20.0",
    );
  });

  it("stays quiet when the version is up to date", async () => {
    const { warns, errors } = captureConsole();
    stubFetch(async () => Response.json({ tag_name: "2.19.0" }));
    await checkVersion("2.19.0");
    expect(warns).toEqual([]);
    expect(errors).toEqual([]);
  });

  it("stays quiet when github answers with an error status", async () => {
    const { warns, errors } = captureConsole();
    stubFetch(async () => new Response("nope", { status: 500 }));
    await checkVersion("2.19.0");
    expect(warns).toEqual([]);
    expect(errors).toEqual([]);
  });

  it("swallows a network failure", async () => {
    const { warns, errors } = captureConsole();
    stubFetch(async () => {
      throw new Error("offline");
    });
    await checkVersion("2.19.0");
    expect(warns).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it("queries the github releases endpoint", async () => {
    captureConsole();
    let calledUrl = "";
    stubFetch(async (url) => {
      calledUrl = url;
      return Response.json({ tag_name: "2.19.0" });
    });
    await checkVersion("2.19.0");
    expect(calledUrl).toBe(RELEASES_URL);
  });
});
