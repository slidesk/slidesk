import type { SliDeskStudioSlide } from "../../types";

const updateSlide = async (
  slides: SliDeskStudioSlide[],
  slide: SliDeskStudioSlide,
) => {
  const file = slides
    .filter((s) => s.file === slide.file)
    .toSorted((a, b) => a.num - b.num)
    .map((s) => (s.num === Number(slide.num) ? slide.content : s.original))
    .join("\n");
  // replace .. in path file to avoid a security break
  const path = `${process.cwd()}${slide.file.replace("..", "a")}`;
  const bFile = Bun.file(path);
  if (await bFile.exists()) {
    bFile.write(file);
  }
};

export default updateSlide;
