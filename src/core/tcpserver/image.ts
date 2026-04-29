import sharp, { type Sharp } from "sharp";
import { Resvg } from "@resvg/resvg-js";
import { ANSI } from "./ansi";

export type ImageFormat = "png" | "jpeg" | "webp" | "gif" | "svg" | "unknown";

export type TerminalCapability = "kitty" | "sixel" | "block";

export interface RenderOptions {
  cols?: number;
  mode?: TerminalCapability;
  loop?: boolean;
  frameDelay?: number;
  svgScale?: number;
}

export interface AnsiFrame {
  ansi: string;
  delayMs: number;
}

export interface AnsiResult {
  frames: AnsiFrame[];
  animated: boolean;
  format: ImageFormat;
  mode: TerminalCapability;
}

export function detectFormat(input: Buffer | string): ImageFormat {
  if (typeof input === "string") {
    const ext = input.split(".").pop()?.toLowerCase();
    const map: Record<string, ImageFormat> = {
      png: "png",
      jpg: "jpeg",
      jpeg: "jpeg",
      webp: "webp",
      gif: "gif",
      svg: "svg",
    };
    return map[ext ?? ""] ?? "unknown";
  }

  if (input[0] === 0x89 && input[1] === 0x50) return "png";
  if (input[0] === 0xff && input[1] === 0xd8) return "jpeg";
  if (
    input.slice(0, 4).toString() === "RIFF" &&
    input.slice(8, 12).toString() === "WEBP"
  )
    return "webp";
  if (
    input.slice(0, 6).toString() === "GIF87a" ||
    input.slice(0, 6).toString() === "GIF89a"
  )
    return "gif";
  if (input.toString("utf8", 0, 200).includes("<svg")) return "svg";

  return "unknown";
}

export function detectCapability(
  env: Record<string, string>,
): TerminalCapability {
  const term = (env.TERM ?? "").toLowerCase();
  const colorterm = (env.COLORTERM ?? "").toLowerCase();

  if (colorterm === "truecolor" || colorterm === "24bit") {
    if (term.includes("kitty") || term.includes("wezterm")) return "kitty";
  }
  if (
    term.includes("xterm") ||
    term.includes("mlterm") ||
    term.includes("sixel")
  )
    return "sixel";

  return "block";
}

async function svgToBuffer(svg: Buffer, scale = 2): Promise<Buffer> {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: scale },
    font: { loadSystemFonts: false },
  });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}

interface GifFrame {
  buffer: Buffer;
  delayMs: number;
}

async function extractGifFrames(input: Buffer): Promise<GifFrame[]> {
  const meta = await sharp(input, { animated: true }).metadata();
  const pageCount = meta.pages ?? 1;
  const delays = ((meta as any).delay as number[] | undefined) ?? [];

  const frames: GifFrame[] = [];

  for (let i = 0; i < pageCount; i++) {
    const buf = await sharp(input, { animated: true, page: i })
      .png()
      .toBuffer();

    frames.push({
      buffer: buf,
      delayMs: delays[i] ?? 100,
    });
  }

  return frames;
}

function pixelAt(
  data: Buffer,
  x: number,
  y: number,
  w: number,
): { r: number; g: number; b: number; a: number } {
  const i = (y * w + x) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

async function renderBlock(imgBuf: Buffer, cols: number): Promise<string> {
  const img = sharp(imgBuf);
  const meta = await img.metadata();

  // Ratio : chaque char = 2 px haut × 1 px large (approx car glyphes ~2:1)
  const rows = Math.round(
    ((meta.height ?? cols) / (meta.width ?? cols)) * cols * 0.5,
  );

  const { data, info } = await img
    .resize(cols, rows * 2, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let out = "";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const top = pixelAt(data, x, y * 2, info.width);
      const bot = pixelAt(data, x, y * 2 + 1, info.width);

      const tr = top.a < 128;
      const br = bot.a < 128;

      if (tr && br) {
        out += " ";
        continue;
      }
      if (tr) {
        out += `\x1b[49m\x1b[38;2;${bot.r};${bot.g};${bot.b}m▄`;
        continue;
      }
      if (br) {
        out += `\x1b[38;2;${top.r};${top.g};${top.b}m\x1b[49m▀`;
        continue;
      }

      out += `\x1b[38;2;${bot.r};${bot.g};${bot.b}m`;
      out += `\x1b[48;2;${top.r};${top.g};${top.b}m▄`;
    }
    out += "\x1b[0m\r\n";
  }

  return out;
}

async function renderSixel(imgBuf: Buffer, cols: number): Promise<string> {
  const img = sharp(imgBuf);
  const meta = await img.metadata();

  const pxW = cols * 8;
  const pxH = Math.round(((meta.height ?? pxW) / (meta.width ?? pxW)) * pxW);

  const { data, info } = await img
    .resize(pxW, pxH, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const colorMap = new Map<string, number>();
  const palette: Array<[number, number, number]> = [];

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // transparent
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    if (!colorMap.has(key) && palette.length < 256) {
      colorMap.set(key, palette.length);
      palette.push([data[i], data[i + 1], data[i + 2]]);
    }
  }

  let out = "\x1bP0;1;8q";

  // Définir la palette
  for (let ci = 0; ci < palette.length; ci++) {
    const [r, g, b] = palette[ci];
    const pr = Math.round((r / 255) * 100);
    const pg = Math.round((g / 255) * 100);
    const pb = Math.round((b / 255) * 100);
    out += `#${ci};2;${pr};${pg};${pb}`;
  }

  const bands = Math.ceil(pxH / 6);

  for (let band = 0; band < bands; band++) {
    const bandLines: string[] = new Array(palette.length).fill("");

    for (let x = 0; x < info.width; x++) {
      const colorBits = new Array(palette.length).fill(0);

      for (let bit = 0; bit < 6; bit++) {
        const y = band * 6 + bit;
        if (y >= info.height) continue;
        const pxIdx = (y * info.width + x) * 4;
        if (data[pxIdx + 3] < 128) continue;

        const key = `${data[pxIdx]},${data[pxIdx + 1]},${data[pxIdx + 2]}`;
        const ci = colorMap.get(key) ?? 0;
        colorBits[ci] |= 1 << bit;
      }

      for (let ci = 0; ci < palette.length; ci++) {
        bandLines[ci] += String.fromCharCode(63 + colorBits[ci]);
      }
    }

    for (let ci = 0; ci < palette.length; ci++) {
      if (!bandLines[ci] || bandLines[ci].split("").every((c) => c === "?"))
        continue;
      out += `#${ci}${bandLines[ci]}`;
    }
    out += "$\r\n";
  }

  out += "\x1b\\";

  return out;
}

async function renderKitty(imgBuf: Buffer, cols: number): Promise<string> {
  const img = sharp(imgBuf);
  const meta = await img.metadata();

  const pxW = cols * 8;
  const pxH = Math.round(((meta.height ?? pxW) / (meta.width ?? pxW)) * pxW);

  const rawBuf = await img
    .resize(pxW, pxH, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const b64 = rawBuf.toString("base64");
  const chunks = b64.match(/.{1,4096}/g) ?? [];

  let out = "";

  chunks.forEach((chunk, i) => {
    const isLast = i === chunks.length - 1;
    const params =
      i === 0
        ? `a=T,f=32,v=${pxH},s=${pxW},m=${isLast ? 0 : 1}`
        : `m=${isLast ? 0 : 1}`;
    out += `\x1b_G${params};${chunk}\x1b\\`;
  });

  return out;
}

export async function imageToAnsi(
  input: Buffer | string,
  options: RenderOptions = {},
): Promise<AnsiResult> {
  const {
    cols = 80,
    mode = "block",
    loop = true,
    frameDelay,
    svgScale = 2,
  } = options;

  let buf: Buffer;
  if (typeof input === "string") {
    if (input.startsWith("http://") || input.startsWith("https://")) {
      buf = Buffer.from(await (await fetch(input)).arrayBuffer());
    } else {
      buf = await Bun.file(input)
        .bytes()
        .then((b) => Buffer.from(b));
    }
  } else {
    buf = input;
  }

  const format = detectFormat(buf);

  let workBuf = buf;
  if (format === "svg") {
    workBuf = await svgToBuffer(buf, svgScale);
  }

  if (format === "gif") {
    const gifFrames = await extractGifFrames(workBuf);

    if (gifFrames.length > 1) {
      const ansiFrames: AnsiFrame[] = [];

      for (const gf of gifFrames) {
        const ansi = await renderByMode(gf.buffer, cols, mode);
        ansiFrames.push({
          ansi,
          delayMs: frameDelay ?? gf.delayMs,
        });
      }

      return { frames: ansiFrames, animated: true, format, mode };
    }

    workBuf = gifFrames[0].buffer;
  }

  const ansi = await renderByMode(workBuf, cols, mode);

  return {
    frames: [{ ansi, delayMs: 0 }],
    animated: false,
    format,
    mode,
  };
}

async function renderByMode(
  buf: Buffer,
  cols: number,
  mode: TerminalCapability,
): Promise<string> {
  switch (mode) {
    case "kitty":
      return renderKitty(buf, cols);
    case "sixel":
      return renderSixel(buf, cols);
    case "block":
    default:
      return renderBlock(buf, cols);
  }
}

export async function playAnimation(
  result: AnsiResult,
  write: (data: string) => void,
  signal?: AbortSignal,
  loop = true,
): Promise<void> {
  write(ANSI.hideCursor);

  do {
    for (const frame of result.frames) {
      if (signal?.aborted) break;
      write(ANSI.home + frame.ansi + ANSI.reset);
      if (frame.delayMs > 0) await Bun.sleep(frame.delayMs);
    }
  } while (loop && !signal?.aborted);

  write(ANSI.showCursor);
}

const PLACEHOLDER_PREFIX = "\x00IMG:";
const PLACEHOLDER_SUFFIX = "\x00";

export interface PrepassOptions extends RenderOptions {
  fallbackToAlt?: boolean;
  imageCols?: number;
}

function extractAttr(attrs: string, name: string): string {
  const m = attrs.match(new RegExp(`${name}=["']?([^"'\\s>]*)["']?`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("Invalid data URL");
  const meta = dataUrl.slice(5, comma); // "image/png;base64"
  const data = dataUrl.slice(comma + 1);
  const isB64 = meta.includes(";base64");
  return isB64
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data), "utf8"); // SVG inline non-b64
}

export async function preprocessImages(
  html: string,
  options: PrepassOptions = {},
): Promise<string> {
  const {
    cols = 80,
    mode = "block",
    fallbackToAlt = true,
    imageCols,
    svgScale = 2,
  } = options;

  const renderCols = imageCols ?? cols;
  const imgPattern = /<img([^>]*)>/gi;
  const jobs: Array<{
    original: string;
    src: string;
    alt: string;
    placeholder: string;
  }> = [];

  let processedHtml = html.replace(
    /<a([^>]*)>\s*<img([^>]*)>\s*<\/a>/gi,
    (full, aAttrs, imgAttrs) => {
      const src = extractAttr(imgAttrs, "src");
      const alt = extractAttr(imgAttrs, "alt");
      const href = extractAttr(aAttrs, "href");
      if (!src) return full;

      const placeholder = `${PLACEHOLDER_PREFIX}${jobs.length}${PLACEHOLDER_SUFFIX}`;
      jobs.push({ original: full, src, alt, placeholder });
      return `${placeholder}<a href="${href}">${alt || src}</a>`;
    },
  );

  processedHtml = processedHtml.replace(imgPattern, (full, attrs) => {
    const src = extractAttr(attrs, "src");
    const alt = extractAttr(attrs, "alt");
    if (!src) return fallbackToAlt && alt ? alt : "";

    const placeholder = `${PLACEHOLDER_PREFIX}${jobs.length}${PLACEHOLDER_SUFFIX}`;
    jobs.push({ original: full, src, alt, placeholder });
    return placeholder;
  });

  if (jobs.length === 0) return html;

  const renderOpts: RenderOptions = { cols: renderCols, mode, svgScale };

  const renders = await Promise.allSettled(
    jobs.map(async (job) => {
      let buf: Buffer;

      if (job.src.startsWith("data:")) {
        buf = dataUrlToBuffer(job.src);
      } else if (
        job.src.startsWith("http://") ||
        job.src.startsWith("https://")
      ) {
        const res = await fetch(job.src);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        buf = Buffer.from(await res.arrayBuffer());
      } else {
        buf = Buffer.from(await Bun.file(job.src).arrayBuffer());
      }

      const result = await imageToAnsi(buf, renderOpts);

      return result.frames[0].ansi;
    }),
  );

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const result = renders[i];

    let replacement: string;

    if (result.status === "fulfilled") {
      replacement = result.value;
    } else {
      replacement = fallbackToAlt && job.alt ? `[Image: ${job.alt}]` : "";
    }

    processedHtml = processedHtml.replace(job.placeholder, replacement);
  }

  return processedHtml;
}
