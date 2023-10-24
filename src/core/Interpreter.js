import { minify } from "html-minifier-terser";
import { readdirSync, existsSync } from "node:fs";
import layoutHTML from "../templates/layout.html.txt";
import themeCSS from "../templates/theme.css.txt";
import printCSS from "../templates/print.css.txt";
import mainJS from "../templates/main.js.txt";
import slugify from "../utils/slugify";
import image from "../components/image";
import comments from "../components/comments";
import list from "../components/list";

const { error } = console;

const socket =
  // eslint-disable-next-line no-template-curly-in-string
  "window.slidesk.io = new WebSocket(`ws://${window.location.host}/ws`);";

let customCSS = "";
let customJS = "";
let customSVJS = "";

let classes = "";
let timerSlide = "";
let timerCheckpoint = "";
let slug = null;
let sdfPath = "";
let plugins = [];

const toBinary = (string) => {
  const codeUnits = new Uint16Array(string.length);
  for (let i = 0; i < codeUnits.length; i += 1) {
    codeUnits[i] = string.charCodeAt(i);
  }
  return btoa(String.fromCharCode(...new Uint8Array(codeUnits.buffer)));
};

export default class Interpreter {
  static convert = async (mainFile, options) => {
    customCSS = "";
    customJS = "";
    customSVJS = "";
    classes = "";
    timerSlide = "";
    timerCheckpoint = "";
    slug = null;
    sdfPath = "";
    plugins = [];
    // eslint-disable-next-line no-undef
    const sdfMainFile = Bun.file(mainFile);
    sdfPath = mainFile.substring(0, mainFile.lastIndexOf("/"));
    await this.#loadPlugins();
    if (sdfMainFile.size === 0) {
      error("🤔 main.sdf was not found");
      return null;
    }
    const presentation = await this.#getPresentation(mainFile, options);
    let template = layoutHTML;
    template = template.replace("#STYLES#", this.#getCSSTemplate(options));
    template = template.replace("#SCRIPT#", this.#getJSTemplate(options));
    // translation management
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

  static #loadPlugins = async () => {
    const pluginsDir = `${sdfPath}/plugins`;
    if (existsSync(pluginsDir))
      await Promise.all(
        readdirSync(pluginsDir).map(async (plugin) => {
          const pluginPath = `${sdfPath}/plugins/${plugin}/plugin.json`;
          // eslint-disable-next-line no-undef
          const pluginFile = Bun.file(pluginPath);
          const exists = await pluginFile.exists();
          if (exists) {
            plugins.push(await pluginFile.json());
          }
        }),
      );
  };

  static #getSelectLang = (menuLang, key) =>
    `<select id="sd-langs" onchange="window.location.href = this.value;">${menuLang.map(
      (o) =>
        `<option value="${o.value}" ${key === "index" ? "selected" : ""}>${
          o.label
        }</option>`,
    )}</select></body>`;

  static #getJSTemplate = (options) => `${plugins
    .map((p) =>
      p.addScripts
        ? p.addScripts.map((s) => `<script src="${s}"></script>`).join("")
        : "",
    )
    .join("")}<script type="module" id="sd-scripts" data-sv="${[
    customSVJS,
    plugins
      .filter((p) => p.addSpeakerScripts)
      .map((p) => p.addSpeakerScripts)
      .join(","),
  ].join(",")}">
  window.slidesk = {
    currentSlide: 0,
    slides: [],
    animationTimer: ${options.transition},
    onSlideChange: function() {${plugins
      .map((p) => p.onSlideChange ?? "")
      .join("")}}
  };
  ${!options.save ? socket : ""}
  ${mainJS}
</script>${customJS}`;

  static #getCSSTemplate = (options) =>
    `<style>
    :root { --animationTimer: ${options.transition}ms; }
    ${themeCSS}
    ${printCSS}
    </style>
    ${plugins
      .map((p) =>
        p.addStyles
          ? p.addStyles
              .map((s) => `<link rel="stylesheet" href="${s}" />`)
              .join("")
          : "",
      )
      .join("")}
      ${
        customCSS.length
          ? `<link id="sd-customcss" rel="stylesheet" href="${customCSS}">`
          : ""
      }`;

  static #getPresentation = async (mainFile, options) => {
    let fusion = await this.#includes(mainFile);
    // get Custom configuration
    const m = /\/::([\s\S]*)::\//m.exec(fusion);
    if (m !== null) {
      fusion = fusion.replace(m[0], "");
      this.#config(m[1]);
    }
    // comments
    fusion = comments(fusion);
    // slice & treatment
    fusion = this.#sliceSlides(fusion, options);
    // get mainTitle
    fusion = this.#mainTitle(fusion);
    // image
    fusion = image(fusion);
    return `${fusion}${plugins.map((p) => p.addHTML ?? "").join("")}`;
  };

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
      .map((slide, s) => this.#treatSlide(slide, s, options))
      .join("");

  static #paragraph = (paragraph, p) => {
    const par = paragraph.trimStart();
    switch (true) {
      case par.startsWith("-"):
        return list(par, 1);
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
      if (spl[0].trim() !== "") {
        slug = slugify(spl[0]);
        return this.#formatting(spl[0], "h2");
      }
    }
    if (par.length) return this.#formatting(par, "p");
    return "";
  };

  static #treatSlide = (slide, s, options) => {
    classes = "";
    timerSlide = "";
    timerCheckpoint = "";
    slug = null;
    const content = slide
      .replace(/\\r/g, "")
      .split("\n\n")
      .map(this.#paragraph)
      .join("\n\n");
    const datas = {};
    const slideSlug = s ? `!slide-${s}` : "";
    datas.num = s;
    datas.slug = slug || slideSlug;
    if (plugins.includes("source")) datas.source = toBinary(slide);
    if (options.timers) {
      if (timerSlide !== "") datas["timer-slide"] = timerSlide;
      if (timerCheckpoint !== "") datas["timer-checkpoint"] = timerCheckpoint;
    }
    const dataset = [];
    Object.entries(datas).forEach(([key, val]) => {
      dataset.push(`data-${key}="${val}"`);
    });
    return `<section class="sd-slide ${classes}" ${dataset.join(
      " ",
    )}>${content}</section>`;
  };

  static #timers = (data) => {
    // timers
    const timer = data.replace("//@", "").replaceAll(" ", "");
    if (timer.startsWith("[]")) timerSlide = timer.replace("[]", "");
    if (timer.startsWith("<")) timerCheckpoint = timer.replace("<", "");
    return "";
  };

  static #config = (data) => {
    const lines = [...data.split("\n")].filter((l) => l.length);
    lines.forEach((line) => {
      if (line.startsWith("custom_css:"))
        customCSS = line.replace("custom_css:", "").trim();
      else if (line.startsWith("custom_js:"))
        customJS = `<script src="${line
          .replace("custom_js:", "")
          .trim()}"></script>`;
      else if (line.startsWith("custom_sv_js"))
        customSVJS = line.replace("custom_sv_js:", "").trim();
    });
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

  static #mainTitle = (data) => {
    let fusion = data;
    const m = /<p># (.*)<\/p>/.exec(fusion);
    if (m !== null) {
      fusion = fusion.replace(m[0], `<h1>${m[1]}</h1>`);
    }
    return fusion;
  };

  static #polish = async (presentation, template) => {
    let tpl = template;
    [...presentation.matchAll(/<h1>([^\0]*)<\/h1>/g)].forEach((title) => {
      tpl = tpl.replace("#TITLE#", title[1]);
    });
    tpl = tpl.replace("#SECTIONS#", presentation);

    return minify(tpl, {
      collapseWhitespace: true,
      removeEmptyElements: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      removeAttributeQuotes: true,
    });
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
