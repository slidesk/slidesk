import type { DotenvParseOutput } from "dotenv";
import pc from "picocolors";
import terminalImage from "terminal-image";
import terminalSize from "terminal-size";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import replaceAsync from "../../utils/replaceAsync";

const td = new TurndownService({
  headingStyle: "atx",
})
  .use(gfm)
  .addRule("joliHeading", {
    filter: ["h1", "h2"],
    replacement: (content) => pc.bold(pc.blue(content)),
  })
  .addRule("joliCode", {
    filter: ["code"],
    replacement: (content) => pc.bold(pc.green(content)),
  })
  .addRule("joliBold", {
    filter: ["b", "strong"],
    replacement: (content) => pc.bold(content),
  })
  .addRule("joliUnderline", {
    filter: ["u"],
    replacement: (content) => pc.underline(content),
  })
  .addRule("joliItalic", {
    filter: ["em", "i"],
    replacement: (content) => pc.italic(content),
  })
  .addRule("joliLink", {
    filter: ["a"],
    replacement: (content) => pc.blue(pc.underline(content)),
  });

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
      td.turndown(slides[currentSlideIndex]),
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
