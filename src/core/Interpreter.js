import { minify } from "html-minifier-terser";

const animationTimer = 300;

const socket = `window.slidesk.io = new WebSocket("ws://localhost:#PORT#/ws");`;

let customCSS = "";
let customJS = "";
let customSVJS = "";

const layoutHTML = import.meta.resolveSync("../templates/layout.html");
const themeCSS = import.meta.resolveSync("../templates/theme.css");
const mainJS = import.meta.resolveSync("../templates/main.js");

export default class Interpreter {
  static convert = (mainFile, options) =>
    new Promise(async (resolve, reject) => {
      const sdfMainFile = Bun.file(mainFile);
      if (sdfMainFile.size === 0) {
        reject(new Error("🤔 main.sdf was not found"));
      }
      const presentation = this.#sliceSlides(await this.#includes(mainFile));
      let template = await Bun.file(layoutHTML).text();
      template = template.replace(
        "/* #STYLES# */",
        `:root { --animationTimer: ${animationTimer}ms; }${await Bun.file(
          themeCSS
        ).text()}${
          customCSS.length
            ? `</style><link id="sd-customcss" rel="stylesheet" href="${customCSS}"><style>`
            : ""
        }`
      );
      template = template.replace(
        "#SCRIPT#",
        `<script type="module" id="sd-scripts" data-sv="${customSVJS}">
          window.slidesk = {
            currentSlide: 0,
            slides: [],
            animationTimer: ${animationTimer}
          };
          #SOCKETS#
          #CONTROLS#
        </script>${customJS}`
          .replace(
            "#SOCKETS#",
            !options.save ? socket.replace("#PORT#", options.port) : ""
          )
          .replace("#CONTROLS#", await Bun.file(mainJS).text())
      );
      [...presentation.matchAll(/<h1>([^\0]*)<\/h1>/g)].map((title) => {
        template = template.replace("#TITLE#", title[1]);
      });
      template = template.replace("#SECTIONS#", presentation);

      minify(template, {
        collapseWhitespace: true,
        removeEmptyElements: true,
        minifyCSS: true,
        minifyJS: true,
      }).then((minified) => {
        resolve(minified);
      });
    });

  static #replaceAsync = async (str, regex, asyncFn) => {
    const promises = [];
    str.replace(regex, (match, ...args) => {
      const promise = asyncFn(match, ...args);
      promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
  };

  static #includes = async (file) => {
    let data = await Bun.file(file).text();
    return this.#replaceAsync(data, /\n!include\(([^()]+)\)/g, async (_, p1) =>
      this.#includes(`${file.substring(0, file.lastIndexOf("/"))}/${p1}`)
    );
  };

  static #sliceSlides = (presentation) =>
    [...presentation.split("\n## ")]
      .map((slide, s) => this.#transform(slide, s))
      .join("");

  static #transform = (slide, s) => {
    let classes = "";
    let slug = null;
    const content = slide
      .replace(/\\r/g, "")
      .split("\n\n")
      .map((paragraph, p) => {
        if (paragraph.startsWith("/::")) return this.#config(paragraph);
        if (paragraph.startsWith("# ")) return this.#mainTitle(paragraph);
        if (paragraph.startsWith("/*")) return this.#comments(paragraph);
        if (paragraph.startsWith("!image")) return this.#image(paragraph);
        if (paragraph.startsWith("- ")) return this.#list(paragraph);
        if (paragraph.startsWith("<")) return paragraph;
        if (p === 0) {
          const spl = [...paragraph.split(".[")];
          if (spl.length !== 1) {
            classes = spl[1].replace("]", "");
          }
          if (paragraph !== "") {
            slug = this.#slugify(paragraph);
            return this.#formatting(spl[0], "h2");
          }
        }
        if (paragraph.length) return this.#formatting(paragraph, "p");
        return "";
      })
      .join("");
    return `<section class="🎞️ ${classes}" data-slug="${
      slug ?? `${s ? `!slide-${s}` : ""}`
    }">${content}</section>`;
  };

  static #comments = (data) =>
    `<aside class="📝">${data
      .replace("/*", "")
      .replace("*/", "")
      .split("\n")
      .slice(1)
      .join("<br/>")}</aside>`;

  static #config = (data) => {
    [...data.split("\n")].forEach((line) => {
      if (line.startsWith("custom_css:"))
        customCSS = line.replace("custom_css:", "").trim();
      else if (line.startsWith("custom_js:"))
        customJS = `<script src="${line
          .replace("custom_js:", "")
          .trim()}"></script>`;
      else if (line.startsWith("custom_sv_js"))
        customSVJS = line.replace("custom_sv_js:", "").trim();
    });
    return "";
  };

  static #formatting = (data, element) => {
    let htmlData = data;
    // italic, bold
    [
      ["_", "i"],
      ["\\*", "b"],
      ["```", "pre"],
      ["`", "code"],
      ["˜", "u"],
      ["=", "s"],
    ].forEach((couple) => {
      [
        ...htmlData.matchAll(
          new RegExp(`${couple[0]}([^\\${couple[0]}]+)${couple[0]}`, "gm")
        ),
      ].forEach((match) => {
        htmlData = htmlData.replace(
          match[0],
          `<${couple[1]}>${match[1]}</${couple[1]}>`
        );
      });
    });
    // links
    [
      ...htmlData.matchAll(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g
      ),
    ].forEach((match) => {
      htmlData = htmlData.replace(
        match[0],
        `<a href="${match[0]}" target="_blank" rel="noopener">${match[0]}</a>`
      );
    });
    return `<${element}>${htmlData
      .replace(/<(i|b|u|s|code)>/g, '<span class="$1">')
      .replace(/<\/(i|b|u|s|code)>/g, "</span>")}</${element}>`;
  };

  static #image = (data) => {
    let newData = data;
    [...newData.matchAll(/!image\(([^()]+)\)/g)].forEach((match) => {
      const opts = [...match[1].split("|")];
      newData = newData.replace(
        match[0],
        `<img data-src="${opts[0].trim()}" ${
          opts.length > 1 ? opts[1].trim() : ""
        } />`
      );
    });
    return newData;
  };

  static #list = (data, level = 1) => {
    const list = [];
    const subs = [];
    [...data.split("\n")].forEach((line) => {
      const reg = new RegExp(`^[-]{${level}} `, "m");
      if (line.match(reg)) {
        if (subs.length) {
          list.push(this.#list(subs.join("\n"), level + 1));
          subs.splice(0, subs.length);
        }
        list.push(`<li>${line.replace(reg, "")}</li>`);
      } else if (line !== "") subs.push(line);
    });
    if (subs.length) {
      list.push(this.#list(subs.join("\n"), level + 1));
    }
    return `<ul>${list.join("")}</ul>`;
  };

  static #mainTitle = (data) => `<h1>${data.replace("# ", "")}</h1>`;

  static #slugify = (data) =>
    data
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
}
