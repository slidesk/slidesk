import type { Page } from "../browser";
import { freeze, thaw } from "./freeze";
import walk from "./walk";

const DPI = 96;

const pdf = async (
  page: Page,
  total: number,
  width: number,
  height: number,
  transition: number,
  onSlide: (num: number) => void,
) => {
  await walk(page, total, transition, async (num) => {
    await freeze(page, num - 1);
    onSlide(num);
  });
  await thaw(page);
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
  });
};

export default pdf;
