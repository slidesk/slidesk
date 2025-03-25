import TurndownService from "turndown";
import type { SliDeskFile } from "../types";
import show from "./terminal/show";
import styles from "./terminal/styles";

class Terminal {
  readonly #slides: string[] = [];
  #talkdir = "";
  #currentSlideIndex = 0;
  async create(files: SliDeskFile, _: object, talkdir: string) {
    this.#talkdir = talkdir;
    if (files["/index.html"]) {
      const html =
        /<body class=sd-app>([\s\S]*?)<\/body>/
          .exec(files["/index.html"].content ?? "")
          ?.shift() ?? "";
      const turndown = new TurndownService({
        headingStyle: "atx",
        bulletListMarker: "-",
      });
      const md = turndown.turndown(html);
      this.#slides.push(
        ...(await Promise.all(
          [...md.split("\n## ")].map(
            async (s, i) => await styles(i ? `# ${s}` : s),
          ),
        )),
      );
      show(this.#talkdir, this.#slides, this.#currentSlideIndex);
    } else {
      console.error("No index.html file found.");
    }
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
    show(this.#talkdir, this.#slides, this.#currentSlideIndex);
  }
}

export default Terminal;
