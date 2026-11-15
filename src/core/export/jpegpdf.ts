// width, height and colour components of a jpeg, read from its frame header
const frame = (jpeg: Uint8Array) => {
  let i = 2;
  while (i + 9 < jpeg.length) {
    const marker = jpeg[i + 1];
    // SOF0 to SOF15, except DHT, JPG and DAC which share the range
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    )
      return {
        height: (jpeg[i + 5] << 8) | jpeg[i + 6],
        width: (jpeg[i + 7] << 8) | jpeg[i + 8],
        components: jpeg[i + 9],
      };
    i += 2 + ((jpeg[i + 2] << 8) | jpeg[i + 3]);
  }
  throw new Error("not a jpeg");
};

/** A pdf with one full-page jpeg per page, the pages sized like the viewport. */
const jpegPdf = (images: Uint8Array[], width: number, height: number) => {
  // 96 px per inch, 72 pt per inch
  const w = (width * 3) / 4;
  const h = (height * 3) / 4;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === "string" ? encoder.encode(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  };
  const obj = (n: number, ...parts: (string | Uint8Array)[]) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    parts.forEach(push);
    push("\nendobj\n");
  };

  push("%PDF-1.4\n");
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  const kids = images.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${images.length} >>`);
  images.forEach((jpeg, i) => {
    const n = 3 + i * 3;
    const { width: pw, height: ph, components } = frame(jpeg);
    const draw = `q ${w} 0 0 ${h} 0 0 cm /I Do Q`;
    obj(
      n,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /I ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`,
    );
    obj(n + 1, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
    obj(
      n + 2,
      `<< /Type /XObject /Subtype /Image /Width ${pw} /Height ${ph} /ColorSpace /${components === 1 ? "DeviceGray" : "DeviceRGB"} /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
      jpeg,
      "\nendstream",
    );
  });

  const xref = length;
  const size = 3 + images.length * 3;
  push(`xref\n0 ${size}\n0000000000 65535 f \n`);
  for (let n = 1; n < size; n += 1)
    push(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Uint8Array(Buffer.concat(chunks));
};

export default jpegPdf;
