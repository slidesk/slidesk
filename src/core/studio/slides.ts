import { splitOutsideFences } from "../../utils/fences";
import includes from "../babelfish/includes";

export type StudioSlide = {
  /** relative to the talk */
  file: string;
  /** its part in the file: 0 is what precedes the first "## " title */
  n: number;
  /** its position in the presentation */
  index: number;
  title: string;
  text: string;
};

export type StudioEdit =
  | { action: "save"; file: string; n: number; text: string }
  | { action: "add" | "remove"; file: string; n: number }
  | {
      action: "move";
      file: string;
      n: number;
      to: string;
      at: number;
      after?: boolean;
    };

const SEPARATOR = "\n## ";

const read = async (path: string) =>
  (await Bun.file(path).text()).replaceAll("\r\n", "\n");

/** The parts of a file, as the presentation splits it: [0] precedes its first title. */
export const parts = (text: string) =>
  splitOutsideFences(`\n${text}`, SEPARATOR);

export const join = (p: string[]) => p.join(SEPARATOR).slice(1);

/** Where each slide written in the files of the talk shows in its presentation. */
export const outline = async (talkdir: string, main: string) => {
  const talk = await includes(main);
  const found: { file: string; text: string; at: number }[] = [];
  for (const file of new Bun.Glob("**/*.{sdf,md}").scanSync(talkdir)) {
    const text = await read(`${talkdir}/${file}`);
    // the file as written up to its first include is what the talk shows of it
    // ponytail: slides after an !include in the middle of a file get the wrong index
    const own = text.split("\n!include(")[0];
    const at = own.trim() === "" ? -1 : talk.indexOf(own);
    if (at !== -1) found.push({ file, text, at });
  }
  const slides: StudioSlide[] = [];
  for (const { file, text, at } of found.sort((a, b) => a.at - b.at)) {
    let start = 0;
    parts(text).forEach((part, n) => {
      const before = splitOutsideFences(talk.slice(0, at + start), SEPARATOR);
      const shown = before.filter((s) => s.trim() !== "").length;
      // a slide starts anew, what precedes a title continues the previous one
      const merged = n === 0 && before.at(-1)?.trim() ? 1 : 0;
      if (part.trim() !== "")
        slides.push({
          file,
          n,
          index: shown - merged,
          // before the first "## ", a "# " title, if any
          title:
            (n ? part : (/^# (.*)$/m.exec(part)?.[1] ?? part.trimStart()))
              .split("\n")[0]
              .replace(/\s*\.\[.*$/, "") || "(untitled)",
          text: n ? `## ${part}` : part,
        });
      // the next "## ": parts after the first are preceded by a separator
      start += part.length + (n ? SEPARATOR.length : 0);
    });
  }
  return slides;
};

/** Applies an edit of the studio to the files of the talk. */
export const edit = async (talkdir: string, e: StudioEdit) => {
  const source = await read(`${talkdir}/${e.file}`);
  const p = parts(source);
  if (e.action === "save") p[e.n] = e.n ? e.text.replace(/^## /, "") : e.text;
  if (e.action === "add") p.splice(e.n + 1, 0, "New slide\n");
  if (e.action === "remove") p.splice(e.n, 1, ...(e.n ? [] : [""]));
  if (e.action === "move" && e.n > 0) {
    const [slide] = p.splice(e.n, 1);
    const same = e.to === e.file;
    const dest = same ? p : parts(await read(`${talkdir}/${e.to}`));
    const at = e.at + (e.after ? 1 : 0);
    // the slide left the part list it is moved into: what followed it shifted
    dest.splice(Math.max(1, same && e.n < at ? at - 1 : at), 0, slide);
    if (!same) await Bun.write(`${talkdir}/${e.to}`, join(dest));
  }
  await Bun.write(`${talkdir}/${e.file}`, join(p));
};
