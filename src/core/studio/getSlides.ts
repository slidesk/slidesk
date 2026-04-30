import { globSync } from "node:fs";

const getSlides = async (talkdir: string) => {
  const files = globSync(
    ["md", "sdf"].map((ext) => `${talkdir}/**/*.${ext}`),
  ).sort((a, b) => a.localeCompare(b));
  const res: { file: string; content: string }[] = [];
  for (const file of files) {
    res.push({ file, content: await Bun.file(file).text() });
  }
  return res;
};

export default getSlides;
