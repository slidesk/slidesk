import { existsSync, readFileSync } from "fs";
import { minify } from "html-minifier-terser";
import { html } from "#assets_html";
import { css } from "#assets_css";
import { js } from "#assets_js";

const animationTimer = 300;

const socket = `window.talkflow.io = new WebSocket("ws://localhost:#PORT#");`;

let customCSS = "";
let customJS = "";

export default class Interpreter {
  constructor(mainFile, options) {
    return new Promise((resolve, reject) => {
      if (!existsSync(mainFile)) {
        reject("🤔 main.tfs was not found");
      }
      let presentation = this.#sliceSlides(this.#includes(mainFile));
      let template = html;
      template = template.replace(
        "#STYLE#",
        `:root { --animationTimer: ${animationTimer}ms; }${css}${
          customCSS.length
            ? `</style><link id="tf-customcss" rel="stylesheet" href="${customCSS}"><style>`
            : ""
        }`
      );
      template = template.replace(
        "#SCRIPT#",
        `
<script type="module">
  window.talkflow = {
    currentSlide: 0,
    slides: [],
    animationTimer: ${animationTimer}
  };
  #SOCKETIO#
  #CONTROLS#
</script>${customJS}
`
          .replace(
            "#SOCKETIO#",
            !options.save ? socket.replace("#PORT#", options.port) : ""
          )
          .replace("#CONTROLS#", js)
      );
      presentation.match(/<h1>(.)*<\/h1>/g).map((title) => {
        template = template.replace(
          "#TITLE#",
          title.replace("<h1>", "").replace("</h1>", "")
        );
      });
      template = template.replace("#SECTIONS#", presentation);

      minify(template, {
        collapseWhitespace: true,
        removeEmptyElements: true,
      }).then((html) => {
        resolve(html);
      });
    });
  }

  #includes(file) {
    let data = readFileSync(file, "utf8");
    [...data.matchAll(/!include\(([^\()]+)\)/g)].map(
      (match) =>
        (data = data.replace(
          match[0],
          this.#includes(
            `${file.substring(0, file.lastIndexOf("/"))}/${match[1]}`
          )
        ))
    );
    return data;
  }

  #sliceSlides(presentation) {
    const ccl = {};
    return [...presentation.split("## ")]
      .map((slide, s) => {
        return slide
          .replace(/\\r/g, "")
          .split("\n\n")
          .map((paragraph, p) => {
            if (paragraph.startsWith("/*")) {
              return `<aside class="📝">${paragraph
                .replace("/*", "")
                .replace("*/", "")
                .split("\n")
                .slice(1)
                .join("<br/>")}</aside>`;
            } else if (paragraph.startsWith(":custom_css:")) {
              customCSS = paragraph.replace(":custom_css:", "").trim();
              return "";
            } else if (paragraph.startsWith(":custom_js:")) {
              customJS = `<script src="${paragraph
                .replace(":custom_js:", "")
                .trim()}"></script>`;
              return "";
            } else if (paragraph.startsWith("# "))
              return `<h1>${paragraph.replace("# ", "")}</h1>`;
            else if (paragraph.startsWith("!image"))
              return this.#image(paragraph);
            else if (paragraph.startsWith("- ") || paragraph.startsWith("\n- "))
              return this.#list(paragraph);
            else if (p == 0 && paragraph.length) {
              const spl = [...paragraph.split(".[")];
              if (spl.length != 1) {
                ccl[`s_${s}`] = spl[1].replace("]", "");
                paragraph = spl[0];
              }
              return `<h2 data-slug="${paragraph
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "")}">${paragraph}</h2>`;
            } else if (paragraph.length) {
              return `<p>${this.#formatting(paragraph)}</p>`;
            }
            return "";
          })
          .join("");
      })
      .map(
        (slide, s) =>
          `<section class="🎞️ ${ccl[`s_${s}`] ?? ""}">${slide}</section>`
      )
      .join("");
  }

  #formatting(html) {
    [
      ["_", "i"],
      ["\\*", "b"],
    ].forEach((couple) => {
      [
        ...html.matchAll(
          new RegExp(`${couple[0]}([^\\${couple[0]}]+)${couple[0]}`, "gm")
        ),
      ].map((match) => {
        html = html.replace(
          match[0],
          `<${couple[1]}>${match[1]}</${couple[1]}>`
        );
      });
    });
    return html;
  }

  #image(data) {
    [...data.matchAll(/!image\(([^\()]+)\)/g)].map((match) => {
      const opts = [...match[1].split("|")];
      data = data.replace(
        match[0],
        `<img data-src="${opts[0].trim()}" ${
          opts.length > 1 ? opts[1].trim() : ""
        } />`
      );
    });
    return data;
  }

  #list(data, sub = 0) {
    const list = [];
    let subs = [];
    [...data.split("\n")].forEach((line) => {
      if (line.substring(sub).startsWith("- ")) {
        if (subs.length) {
          line = `${line}${this.#list(subs.join("\n"), sub + 1)}`;
          subs = [];
        }
        list.push(`${line.substring(sub + 2)}`);
      } else if (line.length) {
        subs.push(line);
      }
    });
    return `<ul><li>${list.join(`</li><li>`)}</li></ul>`;
  }
}
