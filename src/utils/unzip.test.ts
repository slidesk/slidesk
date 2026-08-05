import { describe, expect, it } from "bun:test";
import unzip from "./unzip";
import zip from "./zip";

const text = (data: Uint8Array) => new TextDecoder().decode(data);

describe("unzip function", () => {
  it("should read back a deflated entry", () => {
    const archive = zip([{ name: "a.txt", data: "hello ".repeat(100) }]);
    expect(text(unzip(archive)["a.txt"])).toBe("hello ".repeat(100));
  });

  it("should read back a stored entry", () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const files = unzip(zip([{ name: "a.bin", data, store: true }]));
    expect([...files["a.bin"]]).toEqual([1, 2, 3, 4]);
  });

  it("should read every entry of a multi-file archive", () => {
    const files = unzip(
      zip([
        { name: "a.txt", data: "aaaa aaaa aaaa" },
        { name: "dir/b.txt", data: "bbbb bbbb bbbb" },
      ]),
    );
    expect(Object.keys(files).sort()).toEqual(["a.txt", "dir/b.txt"]);
    expect(text(files["dir/b.txt"])).toBe("bbbb bbbb bbbb");
  });

  it("should handle an empty archive", () => {
    expect(Object.keys(unzip(zip([])))).toHaveLength(0);
  });

  it("should reject data that is not a zip", () => {
    expect(() => unzip(new TextEncoder().encode("not a zip at all"))).toThrow(
      "not a zip archive",
    );
  });
});
