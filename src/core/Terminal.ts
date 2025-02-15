import TurndownService from "turndown";
import type { SliDeskFile } from "../types";

class Terminal {
  #slides: string[] = [];
  #talkdir = "";
  #currentSlideIndex = 0;
  create(files: SliDeskFile, _: object, talkdir: string) {
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
      this.#slides.push(...md.split("\n## ").map((s, i) => (i ? `# ${s}` : s)));
      this.#show();
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
    this.#show();
  }

  #show() {
    console.clear();
    console.log(this.#slides[this.#currentSlideIndex]);
  }
}

export default Terminal;
