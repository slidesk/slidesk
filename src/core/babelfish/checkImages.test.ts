import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { captured } from "../../__testing__/console";
import checkImages from "./checkImages";

let talk: string;

beforeEach(() => {
  captured.clear();
  talk = mkdtempSync(join(tmpdir(), "slidesk-images-"));
  mkdirSync(join(talk, "assets"));
  writeFileSync(join(talk, "assets/here.png"), "png");
});

afterEach(() => {
  rmSync(talk, { recursive: true, force: true });
});

const warnings = () => String(captured.warns);

describe("checkImages", () => {
  it("warns about an image that does not exist", () => {
    checkImages("!image(assets/gone.png, Gone)", talk, {});
    expect(warnings()).toContain("image not found: assets/gone.png");
  });

  it("stays quiet for existing images, urls and data", () => {
    checkImages(
      [
        "!image(assets/here.png)",
        "!image(./assets/here.png, alt)",
        "!image(https://example.com/a.png)",
        "!image(//cdn.example.com/a.png)",
        "!image(data:image/png;base64,AAA)",
      ].join("\n"),
      talk,
      {},
    );
    expect(captured.warns).toEqual([]);
  });

  it("looks for -=[COMMON]=- images in COMMON_DIR", () => {
    const shared = join(talk, "shared");
    mkdirSync(shared);
    writeFileSync(join(shared, "logo.svg"), "<svg/>");
    const env = { slidesk: { COMMON_DIR: "shared" } };
    checkImages("!image(-=[COMMON]=-/logo.svg)", talk, env);
    expect(captured.warns).toEqual([]);
    checkImages("!image(-=[COMMON]=-/missing.svg)", talk, env);
    expect(warnings()).toContain("image not found: -=[COMMON]=-/missing.svg");
  });
});
