import type { Page } from "../browser";
import { freeze, thaw } from "./freeze";
import { addNotesPages } from "./notes";
import walk from "./walk";

const DPI = 96;

const pdf = async (
  page: Page,
  total: number,
  width: number,
  height: number,
  transition: number,
  onSlide: (num: number) => void,
  withNotes = false,
) => {
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
