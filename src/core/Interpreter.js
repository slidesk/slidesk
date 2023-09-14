import { minify } from "html-minifier-terser";
import { readdirSync } from "node:fs";
import layoutHTML from "../templates/layout.html.txt";
import themeCSS from "../templates/theme.css.txt";
import printCSS from "../templates/print.css.txt";
import mainJS from "../templates/main.js.txt";
import gamepadJS from "../templates/gamepad.js.txt";
import qrcodeLibJS from "../templates/qrcode.lib.js.txt";
import slugify from "../utils/slugify";

const { error } = console;

const animationTimer = 300;

const socket =
  // eslint-disable-next-line no-template-curly-in-string
  "window.slidesk.io = new WebSocket(`ws://${window.location.host}/ws`);";
const buttonSource = `
  <button id="sdf-showSource" popovertarget="sdf-source">&lt;/&gt;</button>
  <div id="sdf-source" popover><pre>x</pre></div>
`;

let customCSS = "";
let customJS = "";
let customSVJS = "";

let classes = "";
let timerSlide = "";
let timerCheckpoint = "";
let slug = null;

const toBinary = (string) => {
  const codeUnits = new Uint16Array(string.length);
  for (let i = 0; i < codeUnits.length; i += 1) {
    codeUnits[i] = string.charCodeAt(i);
  }
  return btoa(String.fromCharCode(...new Uint8Array(codeUnits.buffer)));
};

export default class Interpreter {
  static convert = async (mainFile, options) => {
    // eslint-disable-next-line no-undef
    const sdfMainFile = Bun.file(mainFile);
    if (sdfMainFile.size === 0) {
      error("🤔 main.sdf was not found");
      return null;
    }
    const presentation = this.#sliceSlides(
      await this.#includes(mainFile),
      options,
    );
    let template = layoutHTML;
    template = template.replace("/* #STYLES# */", this.#getCSSTemplate());
    template = template.replace("#SCRIPT#", this.#getJSTemplate(options));
    // translation management
    const sdfPath = mainFile.substring(0, mainFile.lastIndexOf("/"));
    const langFiles = readdirSync(sdfPath).filter((item) =>
      /.lang.json$/gi.test(item),
    );
    const languages = {};
    if (langFiles.length) {
      const menuLang = [];
      await Promise.all(
        langFiles.map(async (lang) => {
          const langSlug = lang.replace(".lang.json", "");
          // eslint-disable-next-line no-undef
          const translationJSON = await Bun.file(`${sdfPath}/${lang}`).json();
          menuLang.push({
            value: translationJSON.default ? "/" : `/--${langSlug}--/`,
            label: langSlug,
          });
          languages[translationJSON.default ? "index" : langSlug] = {
            html: await this.#polish(
              this.#translate(presentation, translationJSON),
              template,
              options,
            ),
            slug: langSlug,
          };
        }),
      );
      // add menu lang
      Object.keys(languages).forEach((key) => {
        languages[key].html = languages[key].html.replace(
          "</body>",
          this.#getSelectLang(menuLang, key),
        );
      });
    } else {
      languages.index = {
        html: await this.#polish(presentation, template, options),
      };
    }
    return languages;
  };

  static #getSelectLang = (menuLang, key) =>
    `<select id="sdf-langs" onchange="window.location.href = this.value;">${menuLang.map(
      (o) =>
        `<option value="${o.value}" ${key === "index" ? "selected" : ""}>${
          o.label
        }</option>`,
    )}</select></body>`;

  static #getJSTemplate = (
    options,
  ) => `<script type="module" id="sd-scripts" data-sv="${customSVJS}">
  window.slidesk = {
    currentSlide: 0,
    slides: [],
    animationTimer: ${animationTimer},
    qrcode: ${options.qrcode ? "true" : "false"},
    source: ${options.source ? "true" : "false"}
  };
  ${!options.save ? socket : ""}
  ${mainJS}
  ${options.gamepad ? gamepadJS : ""}
</script>${customJS}`;

  static #getCSSTemplate = () =>
    `:root { --animationTimer: ${animationTimer}ms; }${themeCSS}${printCSS}${
      customCSS.length
        ? `</style><link id="sd-customcss" rel="stylesheet" href="${customCSS}"><style>`
        : ""
    }`;

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
    // eslint-disable-next-line no-undef
    const data = await Bun.file(file).text();
    return this.#replaceAsync(data, /\n!include\(([^()]+)\)/g, async (_, p1) =>
      this.#includes(`${file.substring(0, file.lastIndexOf("/"))}/${p1}`),
    );
  };

  static #sliceSlides = (presentation, options) =>
    [...presentation.split("\n## ")]
      .map((slide, s) => this.#transform(slide, s, options))
      .join("");

  static #paragraph = (paragraph, p) => {
    const par = paragraph.trimStart();
    switch (true) {
      case par.startsWith("/::"):
        return this.#config(par);
      case par.startsWith("# "):
        return this.#mainTitle(par);
      case par.startsWith("/*"):
        return this.#comments(par);
      case par.startsWith("!image"):
        return this.#image(par);
      case par.startsWith("- "):
        return this.#list(par);
      case par.startsWith("<"):
        return par;
      case par.startsWith("//@"):
        return this.#timers(par);
      default:
        break;
    }
    if (p === 0) {
      const spl = [...par.split(".[")];
      if (spl.length !== 1) {
        classes = spl[1].replace("]", "");
      }
      if (par !== "") {
        slug = this.#slugify(par);
        return this.#formatting(spl[0], "h2");
      }
    }
    if (par.length) return this.#formatting(par, "p");
    return "";
  };

  static #transform = (slide, s, options) => {
    classes = "";
    timerSlide = "";
    timerCheckpoint = "";
    slug = null;
    const content = slide
      .replace(/\\r/g, "")
      .split("\n\n")
      .map(this.#paragraph)
      .join("");
    const slideSlug = s ? `!slide-${s}` : "";
    return `<section class="sdf-slide ${classes}" data-slug="${
      slug ?? slideSlug
    }"${options.source ? ` data-source="${toBinary(slide)}"` : ""}${
      options.timers && timerSlide !== ""
        ? ` data-timer-slide="${timerSlide}"`
        : ""
    }${
      options.timers && timerCheckpoint !== ""
        ? ` data-timer-checkpoint="${timerCheckpoint}"`
        : ""
    }>${content}</section>`;
  };

  static #timers = (data) => {
    // timers
    const timer = data.replace("//@", "").replaceAll(" ", "");
    if (timer.startsWith("[]")) timerSlide = timer.replace("[]", "");
    if (timer.startsWith("<")) timerCheckpoint = timer.replace("<", "");
    return "";
  };

  static #comments = (data) =>
    `<aside class="sdf-notes">${data
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
    // italic, bold, ...
    [
      ["=", "s"],
      ["_", "i"],
      ["\\*", "b"],
      ["`", "code"],
      ["˜", "u"],
    ].forEach((couple) => {
      [
        ...htmlData.matchAll(
          new RegExp(
            `${couple[0]}${couple[0]}([^\\${couple[0]}]+)${couple[0]}${couple[0]}(\\s)?`,
            "g",
          ),
        ),
      ].forEach((match) => {
        htmlData = htmlData.replace(
          match[0],
          `<span class="${couple[1]}">${match[1]}</span>${match[2] ?? ""}`,
        );
      });
    });
    // links
    [
      ...htmlData.matchAll(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+~#?&/=]*)/g,
      ),
    ].forEach((match) => {
      htmlData = htmlData.replace(
        match[0],
        `<a href="${match[0]}" target="_blank" rel="noopener">${match[0]}</a>`,
      );
    });
    return `<${element}>${htmlData}</${element}>`;
  };

  static #image = (data) => {
    let newData = data;
    [...newData.matchAll(/!image\(([^()]+)\)/g)].forEach((match) => {
      const opts = [...match[1].split("|")];
      newData = newData.replace(
        match[0],
        `<img src="${opts[0].trim()}" ${
          opts.length > 1 ? opts[1].trim() : ""
        } loading="lazy" />`,
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

  static #slugify = (data) => slugify(data);

  static #polish = async (presentation, template, options) => {
    let tpl = template;
    [...presentation.matchAll(/<h1>([^\0]*)<\/h1>/g)].forEach((title) => {
      tpl = tpl.replace("#TITLE#", title[1]);
    });
    tpl = tpl.replace("#SECTIONS#", presentation);
    if (options.source) {
      tpl += buttonSource;
    }
    if (options.qrcode) {
      tpl += '<div id="sdf-qrcode">&nbsp;</div>';
    }

    let minified = await minify(tpl, {
      collapseWhitespace: true,
      removeEmptyElements: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      removeAttributeQuotes: true,
    });

    if (options.qrcode) {
      minified = minified.replace(
        "<script type=module id=sd-scripts",
        `<script>${qrcodeLibJS}</script><script type=module id=sd-scripts`,
      );
    }

    return minified;
  };

  static #translate = (presentation, json) => {
    let pres = presentation;
    [...pres.matchAll(/\$\$(\w+)\$\$(\s)?/g)].forEach((match) => {
      pres = pres.replace(
        match[0],
        (json.translations[match[1]] ?? match[0]) + match[2],
      );
    });
    return pres;
  };
}
