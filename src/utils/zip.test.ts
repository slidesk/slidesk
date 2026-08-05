import { describe, expect, it } from "bun:test";
import { inflateRawSync } from "node:zlib";
import zip from "./zip";

const view = (data: Uint8Array) => new DataView(data.buffer);

const readEntry = (archive: Uint8Array) => {
  const dv = view(archive);
  const method = dv.getUint16(8, true);
  const compSize = dv.getUint32(18, true);
  const nameLen = dv.getUint16(26, true);
  const start = 30 + nameLen;
  const name = new TextDecoder().decode(archive.subarray(30, start));
  const payload = archive.subarray(start, start + compSize);
  return {
    name,
    method,
    content: new TextDecoder().decode(
      method === 8 ? inflateRawSync(payload) : payload,
    ),
  };
};

describe("zip function", () => {
  it("should write a readable local file header", () => {
    const archive = zip([{ name: "hello.txt", data: "hello hello hello" }]);
    expect(view(archive).getUint32(0, true)).toBe(0x04034b50);
    const entry = readEntry(archive);
    expect(entry.name).toBe("hello.txt");
    expect(entry.content).toBe("hello hello hello");
  });

  it("should deflate compressible content", () => {
    const archive = zip([{ name: "a.txt", data: "a".repeat(2000) }]);
    expect(readEntry(archive).method).toBe(8);
    expect(archive.length).toBeLessThan(2000);
  });

  it("should store content flagged as already compressed", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const archive = zip([{ name: "a.png", data, store: true }]);
    expect(readEntry(archive).method).toBe(0);
  });

  it("should store content deflate cannot shrink", () => {
    const archive = zip([{ name: "a.txt", data: "x" }]);
    expect(readEntry(archive).method).toBe(0);
  });

  it("should end with an end-of-central-directory record", () => {
    const archive = zip([
      { name: "a.txt", data: "a" },
      { name: "b.txt", data: "b" },
    ]);
    const eocd = archive.subarray(archive.length - 22);
    const dv = view(new Uint8Array(eocd));
    expect(dv.getUint32(0, true)).toBe(0x06054b50);
    expect(dv.getUint16(8, true)).toBe(2);
    expect(dv.getUint16(10, true)).toBe(2);
  });

  it("should handle an empty archive", () => {
    const archive = zip([]);
    expect(archive.length).toBe(22);
    expect(view(archive).getUint32(0, true)).toBe(0x06054b50);
  });
});
