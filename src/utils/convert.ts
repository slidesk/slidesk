import Convert, { errorContent } from "../core/Convert";
import type { SliDeskPresentOptions, SliDeskSaveOptions } from "../types";

const { error } = console;

export default async (
  talk: string,
  options: SliDeskSaveOptions | SliDeskPresentOptions,
) => {
  let files: { [key: string]: { content: string } } = {};
  try {
    files = await Convert(`${talk}/main.sdf`, options);
  } catch (e) {
    files = await errorContent(options);
    error(e);
  }
  if (files === null) {
    process.exit();
  }
  return files;
};
