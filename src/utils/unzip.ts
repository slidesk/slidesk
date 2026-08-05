import { inflateRawSync } from "node:zlib";

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;

const findEOCD = (data: Uint8Array) => {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const min = Math.max(0, data.length - 65557);
  for (let i = data.length - 22; i >= min; i -= 1) {
    if (dv.getUint32(i, true) === EOCD_SIG) return i;
  }
  return -1;
};

const unzip = (archive: Uint8Array) => {
  const dv = new DataView(
    archive.buffer,
    archive.byteOffset,
    archive.byteLength,
  );
  const eocd = findEOCD(archive);
  if (eocd === -1) throw new Error("not a zip archive");

  const total = dv.getUint16(eocd + 10, true);
  let offset = dv.getUint32(eocd + 16, true);
  const files: Record<string, Uint8Array> = {};

  for (let i = 0; i < total; i += 1) {
    if (dv.getUint32(offset, true) !== CENTRAL_SIG)
      throw new Error("corrupted zip central directory");
    const method = dv.getUint16(offset + 10, true);
    const compSize = dv.getUint32(offset + 20, true);
    const nameLen = dv.getUint16(offset + 28, true);
    const extraLen = dv.getUint16(offset + 30, true);
    const commentLen = dv.getUint16(offset + 32, true);
    const localOffset = dv.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(
      archive.subarray(offset + 46, offset + 46 + nameLen),
    );

    const localNameLen = dv.getUint16(localOffset + 26, true);
    const localExtraLen = dv.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLen + localExtraLen;
    const payload = archive.subarray(start, start + compSize);
    if (!name.endsWith("/"))
      files[name] =
        method === 0 ? payload : new Uint8Array(inflateRawSync(payload));

    offset += 46 + nameLen + extraLen + commentLen;
  }

  return files;
};

export default unzip;
