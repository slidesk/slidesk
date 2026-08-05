type Out = { write: (text: string) => unknown; isTTY?: boolean };

const WIDTH = 24;
const FULL = "█";
const EMPTY = "░";

export const bar = (done: number, total: number, width = WIDTH) => {
  const ratio = total > 0 ? Math.min(Math.max(done / total, 0), 1) : 1;
  const filled = Math.round(ratio * width);
  return `${FULL.repeat(filled)}${EMPTY.repeat(width - filled)} ${done}/${total}`;
};

// a one-line bar redrawn in place; on a pipe or a CI log there is nothing to
// redraw, so it stays quiet and lets the surrounding messages tell the story
const progress = (total: number, out: Out = process.stdout) => {
  let drawn = false;
  return {
    update: (done: number) => {
      if (!out.isTTY) return;
      drawn = true;
      out.write(`\r   ${bar(done, total)}`);
    },
    stop: () => {
      if (!drawn) return;
      drawn = false;
      out.write("\n");
    },
  };
};

export default progress;
