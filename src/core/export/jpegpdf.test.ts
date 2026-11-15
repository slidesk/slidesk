import { describe, expect, it } from "bun:test";
import jpegPdf from "./jpegpdf";

// SOI, an APP0 segment to skip, then a baseline frame header
const jpeg = (width: number, height: number, components = 3) =>
  new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x04,
    0x00,
    0x00,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    height >> 8,
    height & 0xff,
    width >> 8,
    width & 0xff,
    components,
    0xff,
    0xd9,
  ]);

const text = (data: Uint8Array) => Buffer.from(data).toString("latin1");

describe("jpegPdf", () => {
  it("makes one page per image, sized like the viewport in points", () => {
    const pdf = text(jpegPdf([jpeg(3840, 2160), jpeg(3840, 2160)], 1920, 1080));
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("/Count 2");
    expect(pdf.match(/\/MediaBox \[0 0 1440 810\]/g)).toHaveLength(2);
    expect(pdf).toContain("/Width 3840 /Height 2160 /ColorSpace /DeviceRGB");
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("reads a grayscale jpeg as such", () => {
    expect(text(jpegPdf([jpeg(10, 20, 1)], 10, 20))).toContain(
      "/Width 10 /Height 20 /ColorSpace /DeviceGray",
    );
  });

  it("points the cross-reference table at each object", () => {
    const pdf = text(jpegPdf([jpeg(8, 8)], 8, 8));
    const start = Number(/startxref\n(\d+)/.exec(pdf)?.[1]);
    expect(pdf.slice(start).startsWith("xref\n0 6\n")).toBe(true);
    const offsets = [...pdf.slice(start).matchAll(/(\d{10}) 00000 n/g)].map(
      (m) => Number(m[1]),
    );
    offsets.forEach((offset, i) => {
      expect(pdf.slice(offset).startsWith(`${i + 1} 0 obj`)).toBe(true);
    });
  });

  it("rejects what is not a jpeg", () => {
    expect(() => jpegPdf([new Uint8Array([1, 2, 3])], 8, 8)).toThrow(
      "not a jpeg",
    );
  });
});
