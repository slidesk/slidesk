import { existsSync, readFileSync } from "fs";
import { minify } from "html-minifier-terser";
import { html } from "#assets_html";
import { css } from "#assets_css";
import { js } from "#assets_js";

const animationTimer = 300;

const socketio = `
  import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";
  const socket = io();
  socket.on("reload", () => {
    location.reload();
  });
`;

export default class Interpreter {
  constructor(mainFile, options) {
    return new Promise((resolve, reject) => {
      if (!existsSync(mainFile)) {
        reject("🤔 main.tfs was not found");
      }
      let template = html;
      let presentation = this.#sliceSlides(this.#includes(mainFile));
      presentation.match(/<h1>(.)*<\/h1>/g).map((title) => {
        template = template.replace(
          "#TITLE#",
          title.replace("<h1>", "").replace("</h1>", "")
        );
      });
      template = template.replace("#SECTIONS#", presentation);
      template = template.replace(
        "#STYLE#",
        `:root { --animationTimer: ${animationTimer}ms; }${css}`
      );
      template = template.replace(
        "#SCRIPT#",
        `
<script type="module">
  #SOCKETIO#
  window.talkflow = {
    currentSlide: 0,
    slides: [],
    animationTimer: ${animationTimer}
  };
  #CONTROLS#
</script>
`
          .replace("#SOCKETIO#", !options.save ? socketio : "")
          .replace("#CONTROLS#", js)
      );
      minify(this.#formatting(template), {
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
    return [...presentation.split("## ")]
      .map((slide) =>
        slide
          .replace(/\\r/g, "")
          .split("\n\n")
          .map((paragraph, i) => {
            if (paragraph.startsWith("# "))
              return `<h1>${paragraph.replace("# ", "")}</h1>`;
            else if (paragraph.startsWith("!image"))
              return this.#image(paragraph);
            else if (paragraph.startsWith("- ") || paragraph.startsWith("\n- "))
              return this.#list(paragraph);
            else if (i == 0 && paragraph.length)
              return `<h2 data-slug="${paragraph
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "")}">${paragraph}</h2>`;
            else if (paragraph.length) return `<p>${paragraph}</p>`;
            return "";
          })
          .join("")
      )
      .map((slide) => `<section class="slide">${slide}</section>`)
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
