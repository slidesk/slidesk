import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import getFile from "./getFile";

let root: string;

const request = (path: string) =>
  new Request(`http://localhost${path}`, { headers: { host: "localhost" } });

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "slidesk-getfile-"));
  mkdirSync(join(root, "plugins", "demo"), { recursive: true });
  mkdirSync(join(root, "shared", "plugins", "shared-one"), { recursive: true });
  writeFileSync(join(root, "styles.css"), "body{color:red}");
  writeFileSync(join(root, "plugins", "demo", "index.js"), "// demo");
  writeFileSync(
    join(root, "shared", "plugins", "shared-one", "index.js"),
    "// shared",
  );
  writeFileSync(join(root, "shared", "logo.svg"), "<svg></svg>");
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("getFile", () => {
  it("serves an existing file with its content type", async () => {
    const res = getFile(request("/styles.css"), root, {});
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/css");
    expect(await res.text()).toBe("body{color:red}");
  });

  it("returns a 404 for an unknown file", async () => {
    const res = getFile(request("/nope.css"), root, {});
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("not found");
  });

  it("resolves the COMMON placeholder to the configured common dir", async () => {
    const res = getFile(request("/-=[COMMON]=-/logo.svg"), root, {
      slidesk: { COMMON_DIR: "shared" },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("<svg></svg>");
  });

  it("serves a plugin file from the talk directory", async () => {
    const res = getFile(request("/plugins/demo/index.js"), root, {});
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("// demo");
  });

  it("falls back to the common dir for a missing plugin file", async () => {
    const res = getFile(request("/plugins/shared-one/index.js"), root, {
      slidesk: { COMMON_DIR: "shared" },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("// shared");
  });

  it("returns a 404 when the plugin is missing from both directories", () => {
    const res = getFile(request("/plugins/ghost/index.js"), root, {
      slidesk: { COMMON_DIR: "shared" },
    });
    expect(res.status).toBe(404);
  });

  it("does not prefix an absolute url with the talk path", () => {
    const req = new Request("http://localhost/https://example.com/a.png", {
      headers: { host: "localhost" },
    });
    expect(getFile(req, root, {}).status).toBe(404);
  });
});
