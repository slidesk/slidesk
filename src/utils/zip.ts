import { deflateRawSync } from "node:zlib";

export type ZipEntry = {
  name: string;
  data: Uint8Array | string;
  store?: boolean;
};

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
// 1980-01-01 00:00:00, keeps archives reproducible
const DOS_DATE = 0x0021;
const DOS_TIME = 0x0000;

const bytes = (data: Uint8Array | string) =>
  typeof data === "string" ? new TextEncoder().encode(data) : data;

const concat = (chunks: Uint8Array[]) => {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk, _) => {
    out.set(chunk, offset);
    offset += chunk.length;
  });
  return out;
};

const zip = (entries: ZipEntry[]) => {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry, _) => {
    const name = new TextEncoder().encode(entry.name);
    const raw = bytes(entry.data);
    const crc = Bun.hash.crc32(raw);
    const deflated = entry.store ? raw : deflateRawSync(raw);
    const stored = entry.store || deflated.length >= raw.length;
    const payload = stored ? raw : new Uint8Array(deflated);
    const method = stored ? 0 : 8;

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, LOCAL_SIG, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, method, true);
    lv.setUint16(10, DOS_TIME, true);
    lv.setUint16(12, DOS_DATE, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, payload.length, true);
    lv.setUint32(22, raw.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true); // extra length
    local.set(name, 30);
    locals.push(local, payload);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, CENTRAL_SIG, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, method, true);
    cv.setUint16(12, DOS_TIME, true);
    cv.setUint16(14, DOS_DATE, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, payload.length, true);
    cv.setUint32(24, raw.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint16(30, 0, true); // extra
    cv.setUint16(32, 0, true); // comment
    cv.setUint16(34, 0, true); // disk number start
    cv.setUint16(36, 0, true); // internal attributes
    cv.setUint32(38, 0, true); // external attributes
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(central);

    offset += local.length + payload.length;
  });

  const centralSize = centrals.reduce((acc, c) => acc + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, EOCD_SIG, true);
  ev.setUint16(4, 0, true); // this disk
  ev.setUint16(6, 0, true); // disk with central directory
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true); // comment length

  return concat([...locals, ...centrals, eocd]);
};

export default zip;
