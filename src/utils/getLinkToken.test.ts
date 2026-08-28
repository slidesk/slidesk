import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";

import { captured } from "../__testing__/console";

class ExitError extends Error {
  constructor(readonly code?: number) {
    super(`process.exit(${code})`);
  }
}
const exitSpy = spyOn(process, "exit").mockImplementation(((code?: number) => {
  throw new ExitError(code);
}) as never);

const { default: getLinkToken } = await import("./getLinkToken");

const stubTokenFile = (file: { exists: () => boolean; text?: () => string }) =>
  spyOn(Bun, "file").mockImplementation((() => ({
    exists: async () => file.exists(),
    text: async () => file.text?.() ?? "",
  })) as never);

let fileSpy: ReturnType<typeof spyOn> | undefined;

beforeEach(() => {
  captured.clear();
  exitSpy.mockClear();
});

afterEach(() => {
  fileSpy?.mockRestore();
  fileSpy = undefined;
});

describe("getLinkToken", () => {
  it("returns the stored token", async () => {
    fileSpy = stubTokenFile({ exists: () => true, text: () => "a-token" });
    expect(await getLinkToken()).toBe("a-token");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("asks the user to log in when there is no token file", async () => {
    fileSpy = stubTokenFile({ exists: () => false });
    expect(getLinkToken()).rejects.toThrow("process.exit(1)");
    expect(captured.error()).toContain("slidesk link login");
  });

  it("asks the user to log in again when the token is empty", async () => {
    fileSpy = stubTokenFile({ exists: () => true, text: () => "" });
    expect(getLinkToken()).rejects.toThrow("process.exit(1)");
    expect(captured.error()).toContain("--force");
  });
});
