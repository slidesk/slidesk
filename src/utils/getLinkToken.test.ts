import { afterEach, describe, expect, it, spyOn } from "bun:test";

import getLinkToken from "./getLinkToken";

const stubTokenFile = (file: { exists: () => boolean; text?: () => string }) =>
  spyOn(Bun, "file").mockImplementation((() => ({
    exists: async () => file.exists(),
    text: async () => file.text?.() ?? "",
  })) as never);

let fileSpy: ReturnType<typeof spyOn> | undefined;

afterEach(() => {
  fileSpy?.mockRestore();
  fileSpy = undefined;
});

describe("getLinkToken", () => {
  it("returns the stored token", async () => {
    fileSpy = stubTokenFile({ exists: () => true, text: () => "a-token" });
    expect(await getLinkToken()).toBe("a-token");
  });

  it("asks the user to log in when there is no token file", async () => {
    fileSpy = stubTokenFile({ exists: () => false });
    expect(getLinkToken()).rejects.toThrow("slidesk link login");
  });

  it("asks the user to log in again when the token is empty", async () => {
    fileSpy = stubTokenFile({ exists: () => true, text: () => "" });
    expect(getLinkToken()).rejects.toThrow("--force");
  });
});
