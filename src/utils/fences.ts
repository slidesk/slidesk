const FENCE = /^\s*(```|~~~)/;

/** Start and end offsets of the fenced code blocks of `data`; an unclosed one runs to the end. */
export const fencedBlocks = (data: string) => {
  const blocks: [number, number][] = [];
  let open = -1;
  let marker = "";
  let at = 0;
  for (const line of data.split("\n")) {
    const fence = FENCE.exec(line)?.[1];
    if (fence && open === -1) {
      open = at;
      marker = fence;
    } else if (fence && line.trim().startsWith(marker)) {
      blocks.push([open, at + line.length]);
      open = -1;
    }
    at += line.length + 1;
  }
  if (open !== -1) blocks.push([open, data.length]);
  return blocks;
};

const inBlock = (blocks: [number, number][], at: number) =>
  blocks.some(([start, end]) => at > start && at < end);

/** Applies `transform` to the text outside the code blocks: what they show stays as written. */
export const outsideFences = (
  data: string,
  transform: (text: string) => string,
) => {
  let out = "";
  let at = 0;
  for (const [start, end] of fencedBlocks(data)) {
    out += transform(data.slice(at, start)) + data.slice(start, end);
    at = end;
  }
  return out + transform(data.slice(at));
};

/** Splits `data` on `separator`, except where it appears inside a code block. */
export const splitOutsideFences = (data: string, separator: string) => {
  const blocks = fencedBlocks(data);
  const parts: string[] = [];
  let from = 0;
  for (
    let at = data.indexOf(separator);
    at !== -1;
    at = data.indexOf(separator, at + 1)
  )
    if (!inBlock(blocks, at + 1)) {
      parts.push(data.slice(from, at));
      from = at + separator.length;
    }
  parts.push(data.slice(from));
  return parts;
};
