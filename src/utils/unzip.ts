import { inflateRawSync } from "node:zlib";

const EOCD_SIG = 0x06054b50;
// a deck is far below this; a crafted archive could otherwise inflate to gigabytes
export const MAX_UNZIPPED = 500 * 1024 * 1024;
const CENTRAL_SIG = 0x02014b50;

const findEOCD = (data: Uint8Array) => {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const min = Math.max(0, data.length - 65557);
  for (let i = data.length - 22; i >= min; i -= 1) {
    if (dv.getUint32(i, true) === EOCD_SIG) return i;
  }
  return -1;
};

/** Reads the central directory entry at `offset`: its name, method and data. */
const readEntry = (archive: Uint8Array, dv: DataView, offset: number) => {
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
  return {
    name,
    method,
    payload: archive.subarray(start, start + compSize),
    next: offset + 46 + nameLen + extraLen + commentLen,
  };
};

/** Inflates a deflated entry without letting it grow past `budget` bytes. */
const inflate = (payload: Uint8Array, budget: number) => {
  if (budget < 1) return null;
  try {
    return new Uint8Array(inflateRawSync(payload, { maxOutputLength: budget }));
  } catch (e) {
    if ((e as { code?: string }).code === "ERR_BUFFER_TOO_LARGE") return null;
    throw e;
  }
};

const unzip = (archive: Uint8Array, max = MAX_UNZIPPED) => {
  const dv = new DataView(
    archive.buffer,
    archive.byteOffset,
    archive.byteLength,
  );
  const eocd = findEOCD(archive);
  if (eocd === -1) throw new Error("not a zip archive");
  const tooLarge = () =>
    new Error(
      `this archive expands beyond ${Math.round(max / 1024 / 1024)} MB, it is not imported`,
    );

  const files: Record<string, Uint8Array> = {};
  let unzipped = 0;
  let offset = dv.getUint32(eocd + 16, true);
  for (let i = 0; i < dv.getUint16(eocd + 10, true); i += 1) {
    const { name, method, payload, next } = readEntry(archive, dv, offset);
    offset = next;
    if (name.endsWith("/")) continue;
    const content = method === 0 ? payload : inflate(payload, max - unzipped);
    if (content === null || unzipped + content.length > max) throw tooLarge();
    unzipped += content.length;
    files[name] = content;
  }
  return files;
};

export default unzip;
