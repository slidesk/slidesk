import { globSync, lstatSync, readdirSync } from "node:fs";
import replaceAsync from "../../utils/replaceAsync";

const includes = async (file: string): Promise<string> => {
  if (!import.meta.resolve(file).includes(process.cwd())) return "";
  const data = await Bun.file(file).text();
  return replaceAsync(`${data}\n`, /\n!include\(([^()]+)\)/g, async (_, p1) => {
    let [dirOrFile, ...exts] = `${p1}`.split(",");
    if (exts.length === 0) exts = ["sdf", "md"];
    const realDirOrFile = `${file.substring(0, file.lastIndexOf("/"))}/${dirOrFile}`;
    if (lstatSync(realDirOrFile).isDirectory()) {
      const files = globSync(
        exts.map((ext) => `${realDirOrFile}/**/*.${ext}`),
      ).sort((a, b) => a.localeCompare(b));
      const res: string[] = [];
      for await (const file of files) {
        res.push(await includes(file));
      }
      return res.join("\n");
    }
    return includes(realDirOrFile);
  });
};

export default includes;
