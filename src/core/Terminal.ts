import type { DotenvParseOutput } from "dotenv";
import type { SliDeskFile, SliDeskServerOptions } from "../types";
import loadEnv from "../utils/loadEnv";
import show from "./terminal/show";

class Terminal {
  readonly #slides: string[] = [];
  #env: DotenvParseOutput = {};
  #talkdir = "";
  #currentSlideIndex = 0;
  async create(
    files: SliDeskFile,
    options: SliDeskServerOptions,
    talkdir: string,
  ) {
    this.#talkdir = talkdir;
    this.#env = await loadEnv(talkdir, options);
    if (files["/index.html"]) {
      const html =
        /<body class=sd-app>([\s\S]*?)<\/body>/
          .exec(files["/index.html"].content ?? "")
          ?.shift() ?? "";
      const replacer = (_: string, src: string, data: string) =>
        `::img::${btoa(JSON.stringify({ src, data }))}::`;
      this.#slides.push(
        ...html
          .split(/<section class="?sd-slide /)
          .map((t) =>
            t.startsWith("d")
              ? `<section class=sd-slide ${t}`
              : `<section class="sd-slide ${t}`,
          )
          .map((h) =>
            h.replace(/<img src=(.+) loading=lazy([^>]*)>/g, replacer),
          ),
      );
      this.#slides.shift();
      show(this.#talkdir, this.#slides, this.#currentSlideIndex, this.#env);
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
    show(this.#talkdir, this.#slides, this.#currentSlideIndex, this.#env);
  }
}

export default Terminal;
