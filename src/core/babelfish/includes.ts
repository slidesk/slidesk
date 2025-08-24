import { lstatSync, readdirSync } from "node:fs";
import replaceAsync from "../../utils/replaceAsync";

const includeDir = async (file_or_dir: string, p1: string) => {
  const contents = readdirSync(
    `${file_or_dir.substring(0, file_or_dir.lastIndexOf("/"))}/${p1}`,
  );
  const files = contents
    .filter((f) => f.endsWith(".sdf"))
    .sort((a, b) => a.localeCompare(b));
  const res: string[] = [];
  for await (const f of files)
    res.push(
      await includes(
        `${file_or_dir.substring(0, file_or_dir.lastIndexOf("/"))}/${p1}/${f}`,
      ),
    );
  const dirs = contents
    .filter((f) =>
      lstatSync(
        `${file_or_dir.substring(0, file_or_dir.lastIndexOf("/"))}/${p1}/${f}`,
      ).isDirectory(),
    )
    .sort((a, b) => a.localeCompare(b));
  for await (const d of dirs)
    res.push(
      await includeDir(
        `${file_or_dir.substring(0, file_or_dir.lastIndexOf("/"))}/${p1}/${d}`,
        d,
      ),
    );
  return res.join("\n");
};

const includes = async (file: string): Promise<string> => {
  const data = await Bun.file(file).text();
  return replaceAsync(`${data}\n`, /\n!include\(([^()]+)\)/g, async (_, p1) => {
    if (
      lstatSync(
        `${file.substring(0, file.lastIndexOf("/"))}/${p1}`,
      ).isDirectory()
    ) {
      return includeDir(file, String(p1));
    }
    return includes(`${file.substring(0, file.lastIndexOf("/"))}/${p1}`);
  });
};

export default includes;
