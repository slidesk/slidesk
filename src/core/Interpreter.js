/* eslint-disable import/no-unresolved */
import { existsSync, readFileSync } from "fs";
import { minify } from "html-minifier-terser";
import { html } from "#assets_html";
import { css } from "#assets_css";
import { js } from "#assets_js";

const animationTimer = 300;

const socket = `window.slidesk.io = new WebSocket("ws://localhost:#PORT#");`;

let customCSS = "";
let customJS = "";
let customSVJS = "";

export default class Interpreter {
  static convert = (mainFile, options) =>
    // eslint-disable-next-line no-constructor-return
    new Promise((resolve, reject) => {
      if (!existsSync(mainFile)) {
        reject(new Error("🤔 main.tfs was not found"));
      }
      const presentation = this.#sliceSlides(this.#includes(mainFile));
      let template = html;
      template = template.replace(
        "#STYLE#",
        `:root { --animationTimer: ${animationTimer}ms; }${css}${
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
            !options.save && options.notes
              ? socket.replace("#PORT#", options.port)
              : ""
          )
          .replace("#CONTROLS#", js)
      );
      // eslint-disable-next-line array-callback-return
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

  static #includes = (file) => {
    let data = readFileSync(file, "utf8");
    [...data.matchAll(/\n!include\(([^()]+)\)/g)].forEach(
      // eslint-disable-next-line no-return-assign
      (match) =>
        (data = data.replace(
          match[0],
          this.#includes(
            `${file.substring(0, file.lastIndexOf("/"))}/${match[1]}`
          )
        ))
    );
    return data;
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

  static #list = (data, sub = 0) => {
    const list = [];
    let subs = [];
    [...data.split("\n")].forEach((line) => {
      let newLine = line;
      if (newLine.substring(sub).startsWith("- ")) {
        if (subs.length) {
          newLine = `${newLine}${this.#list(subs.join("\n"), sub + 1)}`;
          subs = [];
        }
        list.push(`${newLine.substring(sub + 2)}`);
      } else if (newLine.length) {
        subs.push(newLine);
      }
    });
    return `<ul><li>${list.join(`</li><li>`)}</li></ul>`;
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
