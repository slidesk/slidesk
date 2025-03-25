import { readdirSync, lstatSync } from "node:fs";
import replaceAsync from "../../utils/replaceAsync";

const includes = async (file: string): Promise<string> => {
  const data = await Bun.file(file).text();
  return replaceAsync(`${data}\n`, /\n!include\(([^()]+)\)/g, async (_, p1) => {
    if (
      lstatSync(
        `${file.substring(0, file.lastIndexOf("/"))}/${p1}`,
      ).isDirectory()
    ) {
      const files = readdirSync(
        `${file.substring(0, file.lastIndexOf("/"))}/${p1}`,
      )
        .filter((f) => f.endsWith(".sdf"))
        .sort();
      const res: string[] = [];
      for await (const f of files)
        res.push(
          await includes(
            `${file.substring(0, file.lastIndexOf("/"))}/${p1}/${f}`,
          ),
        );
      return res.join("\n");
    }
    return includes(`${file.substring(0, file.lastIndexOf("/"))}/${p1}`);
  });
};

export default includes;
