import type { Page } from "../browser";
import { freeze, thaw } from "./freeze";
import jpegPdf from "./jpegpdf";
import { addNotesPages, notesHtml, notesShot } from "./notes";
import walk, { shots } from "./walk";

const DPI = 96;

// without chrome (webkit), the pages are captures: one per state of the talk,
// and after the last step of a slide, its notes when asked
const pictures = async (
  page: Page,
  total: number,
  transition: number,
  onSlide: (num: number) => void,
  withNotes: boolean,
) => {
  const notes = withNotes ? await notesHtml(page) : [];
  const { images, slides } = await shots(
    page,
    total,
    transition,
    onSlide,
    "jpeg",
  );
  const pages: Uint8Array[] = [];
  for (const [i, image] of images.entries()) {
    pages.push(image);
    const slide = slides[i];
    if (slides[i + 1] !== slide && notes[slide]?.trim())
      pages.push(await notesShot(page, notes[slide])); // NOSONAR
  }
  return pages;
};

const pdf = async (
  page: Page,
  total: number,
  width: number,
  height: number,
  transition: number,
  onSlide: (num: number) => void,
  withNotes = false,
) => {
  if (!page.printToPDF)
    return jpegPdf(
      await pictures(page, total, transition, onSlide, withNotes),
      width,
      height,
    );
  await walk(page, total, transition, async (slide, step) => {
    await freeze(page, slide, step);
    onSlide(slide + 1);
  });
  await thaw(page);
  if (withNotes) await addNotesPages(page);
  return page.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    paperWidth: width / DPI,
    paperHeight: height / DPI,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    scale: 1,
    transferMode: "ReturnAsBase64",
    generateDocumentOutline: true,
  });
};

export default pdf;
