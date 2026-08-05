import packagejson from "../../../package.json";
import zip, { type ZipEntry } from "../../utils/zip";
import type { Page } from "../browser";
import getNotes from "./notes";
import {
  appProps,
  contentTypes,
  coreProps,
  notesMaster,
  notesMasterRels,
  notesSlide,
  notesSlideRels,
  presentation,
  presentationRels,
  rootRels,
  slide,
  slideLayout,
  slideLayoutRels,
  slideMaster,
  slideMasterRels,
  slideRels,
  theme,
} from "./ooxml";
import walk from "./walk";

const SLIDE_CX = 12192000;

const shots = async (
  page: Page,
  total: number,
  transition: number,
  onSlide: (num: number) => void,
) => {
  const images: Uint8Array[] = [];
  await walk(page, total, transition, async (num) => {
    images.push(await page.screenshot());
    onSlide(num);
  });
  return images;
};

const pptx = async (
  page: Page,
  total: number,
  width: number,
  height: number,
  title: string,
  transition: number,
  onSlide: (num: number) => void,
) => {
  const notes = await getNotes(page);
  const images = await shots(page, total, transition, onSlide);
  const noted = notes
    .map((note, i) => (note === "" ? 0 : i + 1))
    .filter((num) => num !== 0);
  const cy = Math.round((SLIDE_CX * height) / width);
  const date = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  const entries: ZipEntry[] = [
    { name: "[Content_Types].xml", data: contentTypes(total, noted) },
    { name: "_rels/.rels", data: rootRels },
    { name: "docProps/core.xml", data: coreProps(title, date) },
    { name: "docProps/app.xml", data: appProps(total, packagejson.version) },
    {
      name: "ppt/presentation.xml",
      data: presentation(total, SLIDE_CX, cy, noted.length > 0),
    },
    {
      name: "ppt/_rels/presentation.xml.rels",
      data: presentationRels(total, noted.length > 0),
    },
    { name: "ppt/slideMasters/slideMaster1.xml", data: slideMaster },
    {
      name: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
      data: slideMasterRels,
    },
    { name: "ppt/slideLayouts/slideLayout1.xml", data: slideLayout },
    {
      name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
      data: slideLayoutRels,
    },
    { name: "ppt/theme/theme1.xml", data: theme },
  ];

  if (noted.length) {
    entries.push(
      { name: "ppt/theme/theme2.xml", data: theme },
      { name: "ppt/notesMasters/notesMaster1.xml", data: notesMaster },
      {
        name: "ppt/notesMasters/_rels/notesMaster1.xml.rels",
        data: notesMasterRels,
      },
    );
    noted.forEach((num) => {
      entries.push(
        {
          name: `ppt/notesSlides/notesSlide${num}.xml`,
          data: notesSlide(notes[num - 1]),
        },
        {
          name: `ppt/notesSlides/_rels/notesSlide${num}.xml.rels`,
          data: notesSlideRels(num),
        },
      );
    });
  }

  images.forEach((image, i) => {
    entries.push(
      {
        name: `ppt/slides/slide${i + 1}.xml`,
        data: slide(i + 1, SLIDE_CX, cy),
      },
      {
        name: `ppt/slides/_rels/slide${i + 1}.xml.rels`,
        data: slideRels(i + 1, noted.includes(i + 1)),
      },
      { name: `ppt/media/image${i + 1}.png`, data: image, store: true },
    );
  });

  return zip(entries);
};

export default pptx;
