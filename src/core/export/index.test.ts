import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  browserModuleMock,
  browserStub,
  fakePage,
} from "../../__testing__/browser";
import { captured } from "../../__testing__/console";

mock.module("../browser", browserModuleMock);

const { default: exportTalk } = await import("./index");

const fixture = join(import.meta.dir, "../../__fixtures__/talk");
const scratch = join(import.meta.dir, "../../__fixtures__/.tmp-export");

let isClosed = () => false;

const usePage = (slides = 3) => {
  const stub = fakePage(slides);
  browserStub.page = stub.page;
  isClosed = stub.isClosed;
};

beforeEach(() => {
  captured.clear();
  browserStub.launched.length = 0;
  usePage();
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(scratch, { recursive: true });
});

afterEach(() => {
  rmSync(scratch, { recursive: true, force: true });
});

// mock.restore() is deliberately not called here: it would also undo the
// process-wide console spy the tests share, and Bun keeps module mocks
// registered for the lifetime of the process anyway.

describe("exportTalk", () => {
  it("writes a pdf to the requested output", async () => {
    const output = join(scratch, "deck.pdf");
    await exportTalk(fixture, { output });
    expect(existsSync(output)).toBe(true);
    expect(await Bun.file(output).text()).toBe("%PDF");
  });

  it("renders at 1920x1080", async () => {
    await exportTalk(fixture, { output: join(scratch, "deck.pdf") });
    expect(browserStub.launched).toEqual([[1920, 1080]]);
  });

  it("reports the number of slides and the written file", async () => {
    const output = join(scratch, "deck.pdf");
    await exportTalk(fixture, { output });
    expect(captured.log()).toContain("3 slides to export");
    expect(captured.log()).toContain(output);
  });

  it("says slide in the singular for a one slide deck", async () => {
    usePage(1);
    await exportTalk(fixture, { output: join(scratch, "one.pdf") });
    expect(captured.log()).toContain("1 slide to export");
  });

  it("writes a pptx when asked for one", async () => {
    const output = join(scratch, "deck.pptx");
    await exportTalk(fixture, { output, type: "pptx" });
    expect(existsSync(output)).toBe(true);
    // pptx files are zip archives
    expect((await Bun.file(output).bytes()).slice(0, 2)).toEqual(
      new Uint8Array([0x50, 0x4b]),
    );
  });

  it("names the file after the talk directory by default", async () => {
    const previous = process.cwd();
    process.chdir(scratch);
    try {
      await exportTalk(fixture, {});
      expect(existsSync(join(scratch, "talk.pdf"))).toBe(true);
    } finally {
      process.chdir(previous);
    }
  });

  it("prefers the configured title for the default file name", async () => {
    const previous = process.cwd();
    process.chdir(scratch);
    try {
      await exportTalk(fixture, { conf: "titled.toml" });
      expect(existsSync(join(scratch, "ma-presentation.pdf"))).toBe(true);
    } finally {
      process.chdir(previous);
    }
  });

  it("closes the page and stops the server once done", async () => {
    await exportTalk(fixture, { output: join(scratch, "deck.pdf") });
    expect(isClosed()).toBe(true);
  });

  it("closes the page even when the export fails", async () => {
    usePage(0); // prepare rejects when no slide is found
    expect(
      exportTalk(fixture, { output: join(scratch, "deck.pdf") }),
    ).rejects.toThrow("no slide found");
    await Bun.sleep(10);
    expect(isClosed()).toBe(true);
  });
});
