export const ANSI = {
  reset: "\x1b[0m",
  clear: "\x1b[2J\x1b[H",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  blink: "\x1b[5m",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
  fg: {
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    bright: {
      black: "\x1b[90m",
      green: "\x1b[92m",
      yellow: "\x1b[93m",
      cyan: "\x1b[96m",
      white: "\x1b[97m",
    },
  },
  bg: {
    bright: { black: "\x1b[100m" },
  },
  moveTo: (row: number, col: number) => `\x1b[${row};${col}H`,
  eraseLine: "\x1b[2K",
  home: "\x1b[H",
};

export const IAC_ENABLE_CHAR_MODE = Buffer.from([
  255,
  251,
  3, // WILL SGA  (Suppress Go Ahead)
  255,
  251,
  1, // WILL ECHO
  255,
  253,
  3, // DO SGA
  255,
  253,
  31, // DO NAWS   (Negotiate About Window Size)
]);

const ESC = String.fromCharCode(27);
const ANSI_ESCAPE_REGEX = new RegExp(`${ESC}\\[[^m]*m`, "g");

export function parseNAWS(data: Buffer): { cols: number; rows: number } | null {
  // IAC SB NAWS <cols-hi> <cols-lo> <rows-hi> <rows-lo> IAC SE
  for (let i = 0; i < data.length - 6; i++) {
    if (data[i] === 255 && data[i + 1] === 250 && data[i + 2] === 31) {
      const cols = (data[i + 3] << 8) | data[i + 4];
      const rows = (data[i + 5] << 8) | data[i + 6];
      if (cols > 0 && rows > 0) return { cols, rows };
    }
  }
  return null;
}

export function stripTags(html: string): string {
  return html.replaceAll(/<[^>]+>/g, "").trim();
}

export function htmlToAnsi(html: string, width: number): string {
  const text = html
    .replaceAll(/<head[\s\S]*?<\/head>/gi, "")
    .replaceAll(/<script[\s\S]*?<\/script>/gi, "")
    .replaceAll(/<style[\s\S]*?<\/style>/gi, "");

  return (
    text
      // Headings
      .replaceAll(
        /<h1[^>]*>([\s\S]*?)<\/h1>/gi,
        (_, c) =>
          `\r\n${ANSI.bold}${ANSI.fg.bright.white}${"=".repeat(width)}\r\n  ${stripTags(c).trim().toUpperCase()}\r\n${"=".repeat(width)}${ANSI.reset}\r\n`,
      )
      .replaceAll(
        /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
        (_, c) =>
          `\r\n${ANSI.bold}${ANSI.fg.bright.cyan}| ${stripTags(c).trim()}${ANSI.reset}\r\n${ANSI.fg.cyan}${"-".repeat(width)}${ANSI.reset}\r\n`,
      )
      .replaceAll(
        /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
        (_, c) =>
          `\r\n${ANSI.bold}${ANSI.fg.yellow}  * ${stripTags(c).trim()}${ANSI.reset}\r\n`,
      )
      .replaceAll(
        /<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi,
        (_, c) =>
          `\r\n${ANSI.bold}    - ${stripTags(c).trim()}${ANSI.reset}\r\n`,
      )
      // Lists
      .replaceAll(
        /<li[^>]*>([\s\S]*?)<\/li>/gi,
        (_, c) => `  ${ANSI.fg.cyan}>${ANSI.reset} ${stripTags(c).trim()}\r\n`,
      )
      // Inline emphasis
      .replaceAll(
        /<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi,
        (_, _t, c) => `${ANSI.bold}${c}${ANSI.reset}`,
      )
      .replaceAll(
        /<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi,
        (_, _t, c) => `${ANSI.italic}${c}${ANSI.reset}`,
      )
      .replaceAll(
        /<code[^>]*>([\s\S]*?)<\/code>/gi,
        (_, c) =>
          `${ANSI.fg.bright.green}${ANSI.bg.bright.black} ${stripTags(c)} ${ANSI.reset}`,
      )
      .replaceAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, c) => {
        const lines = stripTags(c).split("\n");
        const body = lines
          .map(
            (l) =>
              `${ANSI.fg.bright.black}|${ANSI.reset} ${ANSI.fg.bright.green}${l}${ANSI.reset}`,
          )
          .join("\r\n");
        return `\r\n${ANSI.fg.bright.black}+${"-".repeat(width - 2)}+${ANSI.reset}\n${body}\n${ANSI.fg.bright.black}+${"-".repeat(width - 2)}+${ANSI.reset}\r\n`;
      })
      // Links
      .replaceAll(
        /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
        (_, href, c) =>
          `${ANSI.underline}${ANSI.fg.blue}${stripTags(c)}${ANSI.reset}${ANSI.dim} (${href})${ANSI.reset}`,
      )
      // Horizontal rules / line breaks
      .replaceAll(
        /<hr[^>]*\/?>/gi,
        `\n${ANSI.fg.bright.black}${"-".repeat(width)}${ANSI.reset}\r\n`,
      )
      .replaceAll(/<br[^>]*\/?>/gi, "\r\n")
      // Paragraphs / divs
      .replaceAll(
        /<p[^>]*>([\s\S]*?)<\/p>/gi,
        (_, c) => `\n${stripTags(c).trim()}\r\n`,
      )
      .replaceAll(/<div[^>]*>([\s\S]*?)<\/div>/gi, (_, c) => `${c}\r\n`)
      // Remaining tags
      .replaceAll(/<[^>]+>/g, "")
      // HTML entities
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&apos;", "'")
      .replaceAll("&nbsp;", " ")
      .replaceAll(/&#(\d+);/g, (_, n) =>
        String.fromCodePoint(Number.parseInt(n, 10)),
      )
      // Collapse multiple blank lines
      .replaceAll(/\r\n{3,}/g, "\r\n\r\n")
  );
}

export function wrapText(text: string, width: number): string {
  return text
    .split("\r\n")
    .map((line) => {
      const visLen = line.replaceAll(ANSI_ESCAPE_REGEX, "").length;
      if (visLen <= width) return line;
      const words = line.split(" ");
      const wrapped: string[] = [];
      let current = "";
      for (const word of words) {
        const wLen = word.replaceAll(ANSI_ESCAPE_REGEX, "").length;
        const cLen = current.replaceAll(ANSI_ESCAPE_REGEX, "").length;
        if (cLen + wLen + 1 > width && current) {
          wrapped.push(current);
          current = word;
        } else {
          current = current ? `${current} ${word}` : word;
        }
      }
      if (current) wrapped.push(current);
      return wrapped.join("\r\n");
    })
    .join("\r\n");
}
