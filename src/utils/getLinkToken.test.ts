import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import getLinkToken, { saveLinkToken } from "./getLinkToken";

let dir: string;
let token: string;
const mode = () => statSync(token).mode & 0o777;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "slidesk-token-"));
  token = join(dir, ".slidesk");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("getLinkToken", () => {
  it("returns the stored token", async () => {
    writeFileSync(token, "a-token");
    expect(await getLinkToken(token)).toBe("a-token");
  });

  it("restricts a token readable by other users", async () => {
    writeFileSync(token, "a-token", { mode: 0o644 });
    await getLinkToken(token);
    expect(mode()).toBe(0o600);
  });

  it("asks the user to log in when there is no token file", async () => {
    expect(getLinkToken(token)).rejects.toThrow("slidesk link login");
  });

  it("asks the user to log in again when the token is empty", async () => {
    writeFileSync(token, "");
    expect(getLinkToken(token)).rejects.toThrow("--force");
  });
});

describe("saveLinkToken", () => {
  it("stores the token for its owner only", async () => {
    writeFileSync(token, "old", { mode: 0o644 });
    await saveLinkToken("new", token);
    expect(await Bun.file(token).text()).toBe("new");
    expect(mode()).toBe(0o600);
  });
});
