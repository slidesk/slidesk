import TurndownService from "turndown";
import type { SliDeskFile } from "../types";
import chalk from "chalk";
import terminalImage from "terminal-image";
import replaceAsync from "../utils/replaceAsync";

class Terminal {
  #slides: string[] = [];
  #talkdir = "";
  #currentSlideIndex = 0;
  async create(files: SliDeskFile, _: object, talkdir: string) {
    this.#talkdir = talkdir;
    if (files["/index.html"]) {
      const html =
        (files["/index.html"].content || "")
          .match(/<body class=sd-app>([\s\S]*?)<\/body>/)
          ?.shift() ?? "";
      const turndown = new TurndownService({
        headingStyle: "atx",
        bulletListMarker: "-",
      });
      const md = turndown.turndown(html);
      this.#slides.push(
        ...(await Promise.all(
          [...md.split("\n## ")].map(
            async (s, i) => await this.#styles(i ? `# ${s}` : s),
          ),
        )),
      );
      this.#show();
    } else {
      console.error("No index.html file found.");
    }
  }

  async #styles(markdown: string) {
    let conv = markdown;
    const replacer = (_: string, _p1: string, p2: string) => {
      return `::img::${btoa(p2)}::`;
    };
    conv = conv.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, replacer);
    conv = conv.replace(/# (.+)/g, chalk.bold.underline("$1"));
    conv = conv.replace(/_([^_]+)_/g, chalk.italic("$1"));
    conv = conv.replace(/\*\*(.+?)\*\*/g, chalk.bold("$1"));
    conv = conv.replace(/##/g, "");
    conv = conv.replace(/\\/g, "");
    return conv;
  }

  send(action: string, data?: object | number | string) {
    if (action === "previous") {
      this.#currentSlideIndex = Math.max(0, this.#currentSlideIndex - 1);
    } else if (action === "next") {
      this.#currentSlideIndex = Math.min(
        this.#slides.length - 1,
        this.#currentSlideIndex + 1,
      );
    } else if (action === "goto") {
      this.#currentSlideIndex = Math.max(
        0,
        Math.min(this.#slides.length - 1, Number(data)),
      );
    }
    this.#show();
  }

  async #show() {
    console.clear();
    console.log(
      await replaceAsync(
        this.#slides[this.#currentSlideIndex],
        /::img::([^:]+)::/g,
        async (_, src) => {
          const file = atob(String(src));
          if (String(file).endsWith(".svg")) return "";
          // if (String(file).endsWith(".gif"))
          //   await terminalImage.gifFile(`${this.#talkdir}/${file}`, {
          //     height: "50%",
          //   });
          return await terminalImage.file(`${this.#talkdir}/${file}`, {
            height: "50%",
          });
        },
      ),
    );
  }
}

export default Terminal;
