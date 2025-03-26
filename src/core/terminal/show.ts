import cliHtml from "cli-html";
import replaceAsync from "../../utils/replaceAsync";
import terminalImage from "terminal-image";
import terminalSize from "terminal-size";
import type { DotenvParseOutput } from "dotenv";

export default async (
  talkdir: string,
  slides: string[],
  currentSlideIndex: number,
  env: DotenvParseOutput,
) => {
  const { clear, log } = console;
  const { columns, rows } = terminalSize();
  clear();
  log(
    await replaceAsync(
      cliHtml(slides[currentSlideIndex]),
      /::img::([^:]+)::/g,
      async (_, source) => {
        try {
          const { src, data } = JSON.parse(atob(String(source)));
          let width = -1;
          let height = -1;
          if (data.indexOf("width="))
            width = Number(/width=(\d+)/.exec(data)?.at(1) ?? -1);
          if (data.indexOf("height="))
            height = Number(/height=(\d+)/.exec(data)?.at(1) ?? -1);
          if (String(src).toLowerCase().endsWith(".svg")) return "";
          const opts: { width?: number; height?: number } = {};
          if (width !== -1)
            opts.width = (columns * width) / Number(env.WIDTH ?? "1920");
          if (height !== -1)
            opts.height = (rows * height) / Number(env.HEIGHT ?? "1080");
          console.log(opts);
          if (String(src).toLowerCase().endsWith(".gif")) {
            terminalImage.gifFile(`${talkdir}/${src}`, opts);
            return "";
          }
          return await terminalImage.file(`${talkdir}/${src}`, opts);
        } catch (_) {
          return "";
        }
      },
    ),
  );
};
