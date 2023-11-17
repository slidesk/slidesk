/* eslint-disable no-undef */
import dotenv from "dotenv";
import { minify } from "html-minifier-terser";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import layoutHTML from "../templates/layout.html.txt";
import themeCSS from "../templates/styles.css.txt";
import printCSS from "../templates/print.css.txt";
import mainJS from "../templates/script.js.txt";
import slugify from "../utils/slugify";
import image from "../components/image";
import comments from "../components/comments";
import list from "../components/list";
import pluginsJSON from "../plugins.json";

const { error } = console;

let customCSS = "";

let classes = "";
let timerSlide = "";
let timerCheckpoint = "";
let slug = null;
let sdfPath = "";
let plugins = [];
let components = [];
let hasPluginSource = false;
let env = {};

const toBinary = (string) => {
  const codeUnits = new Uint16Array(string.length);
  for (let i = 0; i < codeUnits.length; i += 1) {
    codeUnits[i] = string.charCodeAt(i);
  }
  return btoa(String.fromCharCode(...new Uint8Array(codeUnits.buffer)));
};

export default class Interpreter {
  static convert = async (mainFile, options) => {
    this.#initVariables();
    const sdfMainFile = Bun.file(mainFile);
    if (sdfMainFile.size === 0) {
      error("🤔 main.sdf was not found");
      return null;
    }
    this.#getRealPath(mainFile);
    await this.#loadEnv();
    await this.#loadPlugins();
    this.#loadComponents();
    const sdf = await this.#prepareSDF(mainFile);
    return this.#generateHTML(
      await this.#getPresentation(sdf, options),
      this.#prepareTPL(options),
      options,
    );
  };

  static #getRealPath = (mainFile) => {
    sdfPath = `${process.cwd()}/${mainFile.substring(
      0,
      mainFile.lastIndexOf("/"),
    )}`;
  };

  static #initVariables = () => {
    customCSS = "";
    classes = "";
    timerSlide = "";
    timerCheckpoint = "";
    slug = null;
    sdfPath = "";
    plugins = [];
    components = [];
  };

  static #loadEnv = async () => {
    const slideskEnvFile = Bun.file(`${sdfPath}/.env`);
    if (slideskEnvFile.size !== 0) {
      const buf = await slideskEnvFile.text();
      env = dotenv.parse(buf);
    }
  };

  static #internalPlugins = () => {
    if (env.PLUGINS) {
      [...env.PLUGINS.split(",")].forEach((p) => {
        const pl = p.trim();
        if (pl === "source") hasPluginSource = true;
        if (pluginsJSON[pl]) {
          plugins.push(pluginsJSON[p.trim()]);
        }
      });
    }
  };

  static #externalPlugins = async () => {
    const pluginsDir = `${sdfPath}/plugins`;
    if (existsSync(pluginsDir))
      await Promise.all(
        readdirSync(pluginsDir).map(async (plugin) => {
          if (plugin === "source") hasPluginSource = true;
          const pluginPath = `${pluginsDir}/${plugin}/plugin.json`;
          const pluginFile = Bun.file(pluginPath);
          const exists = await pluginFile.exists();
          if (exists) {
            const json = await pluginFile.json();
            ["addScripts", "addStyles", "addHtmlFromFiles"].forEach((t) => {
              if (json[t]) {
                const files = json[t];
                json[t] = {};
                files.forEach((s) => {
                  json[t][s] = readFileSync(`${sdfPath}/${s}`, {
                    encoding: "utf8",
                  });
                });
              }
              return true;
            });
            plugins.push(json);
          }
        }),
      );
  };

  static #loadPlugins = async () => {
    this.#internalPlugins();
    await this.#externalPlugins();
  };

  static #loadComponents = () => {
    const componentsDir = `${sdfPath}/components`;
    if (existsSync(componentsDir)) {
      components = readdirSync(componentsDir)
        .filter((item) => /.mjs$/gi.test(item))
        .map((c) => `${componentsDir}/${c}`);
    }
  };

  static #getJS = (options) => `<script>
  window.slidesk = {
    currentSlide: 0,
    slides: [],
    animationTimer: ${options.transition},
    onSlideChange: function() {${plugins
      .map((p) => p.onSlideChange ?? "")
      .join("")}},
    env: ${JSON.stringify(env)},
    lastAction: ""
  };
  ${
    !options.save
      ? `window.slidesk.io = new WebSocket(\`ws${
          env.HTTPS === "true" ? "s" : ""
        }://${window.location.host}/ws\`);`
      : ""
  }
  ${mainJS}
</script>`;

  static #getCSS = (options) =>
    `<style>
    :root { --animationTimer: ${options.transition}ms; }
    ${themeCSS}
    ${printCSS}
    </style>
    ${plugins
      .map((p) =>
        p.addStyles
          ? Object.keys(p.addStyles)
              .map((k) => `<style data-href="${k}">${p.addStyles[k]}</style>`)
              .join("")
          : "",
      )
      .join("")}
      ${customCSS}`;

  static #getPluginsJS = () =>
    `${plugins
      .map((p) =>
        p.addScripts
          ? Object.keys(p.addScripts)
              .map((k) => `<script data-src="${k}">${p.addScripts[k]}</script>`)
              .join("")
          : "",
      )
      .join("")}`;

  static #prepareSDF = async (mainFile) => {
    let fusion = await this.#includes(mainFile);
    // get Custom configuration
    const m = /\/::([\s\S]*)::\//m.exec(fusion);
    if (m !== null) {
      fusion = fusion.replace(m[0], "");
      this.#config(m[1]);
    }
    return fusion;
  };

  static #prepareTPL = (options) => {
    let template = layoutHTML;
    template = template.replace("#STYLES#", this.#getCSS(options));
    template = template.replace("#SCRIPT#", this.#getJS(options));
    return template;
  };

  static #getPresentation = async (sdf, options) => {
    let fusion = sdf;
    // comments
    fusion = comments(fusion);
    // slice & treatment
    fusion = this.#sliceSlides(fusion, options);
    // custom components
    await Promise.all(
      components.map(async (c) => {
        const { default: comp } = await import(c);
        fusion = comp(fusion);
      }),
    );
    // format text
    fusion = this.#formatting(fusion);
    // image
    fusion = image(fusion);
    // mainTitle
    fusion = this.#mainTitle(fusion);
    return fusion;
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
        return `<h2>${spl[0]} </h2>`;
      }
      return "";
    }
    if (par.length) return `<p>${par} </p>`;
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
    if (hasPluginSource) datas.source = toBinary(slide);
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
        customCSS = `<link rel="stylesheet" href="${line
          .replace("custom_css:", "")
          .trim()}" />`;
    });
  };

  static #links = (data) => {
    let htmlData = data;
    [...htmlData.matchAll(/https?:\/\/(\S*)/g)].forEach((match) => {
      htmlData = htmlData.replace(
        match[0],
        `<a href="${match[0]}" target="_blank" rel="noopener">${match[0]}</a>`,
      );
    });
    return htmlData;
  };

  static #grammar = (data) => {
    let htmlData = data;
    [
      ["=", "s"],
      ["_", "i"],
      ["\\*", "b"],
      ["`", "code"],
      ["˜", "u"],
    ].forEach((couple) => {
      if (
        (htmlData.match(new RegExp(`${couple[0]}{2}`)) || []).length &&
        !htmlData.includes("data-source")
      ) {
        htmlData = [...htmlData.split(new RegExp(`${couple[0]}{2}`))]
          .map((t, i) => {
            if (i % 2) return `<span class="${couple[1]}">${t}</span>`;
            return t;
          })
          .join("");
      }
    });
    return htmlData;
  };

  static #formatting = (data) =>
    [...data.split("\n")]
      .map((l) => {
        let nl = l;
        nl = this.#grammar(nl);
        nl = this.#links(nl);
        return nl;
      })
      .join("\n");

  static #mainTitle = (data) => {
    let fusion = data;
    const m = /<p># (.*)<\/p>/.exec(fusion);
    if (m !== null) {
      fusion = fusion.replace(m[0], `<h1>${m[1]}</h1>`);
    }
    return fusion;
  };

  static #generateHTML = async (presentation, template, options) => {
    const langFiles = readdirSync(sdfPath).filter((item) =>
      /.lang.json$/gi.test(item),
    );
    const languages = {};
    if (langFiles.length) {
      const menuLang = [];
      await Promise.all(
        langFiles.map(async (lang) => {
          const langSlug = lang.replace(".lang.json", "");
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

  static #translate = (presentation, json) => {
    let pres = presentation;
    [...pres.matchAll(/\${2}(\w+)\${2}/g)].forEach((match) => {
      pres = pres.replace(match[0], json.translations[match[1]] ?? match[0]);
    });
    return pres;
  };

  static #polish = async (presentation, template) => {
    let tpl = template;
    [...presentation.matchAll(/<h1>(.*)<\/h1>/g)].forEach((title) => {
      tpl = tpl.replace("#TITLE#", title[1]);
    });
    tpl = tpl.replace("#SECTIONS#", presentation);

    tpl = await minify(tpl, {
      collapseWhitespace: true,
      removeEmptyElements: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      removeAttributeQuotes: true,
    });

    return tpl
      .replace(
        "</body>",
        `${plugins.map((p) => p.addHTML ?? "").join("")}${plugins
          .map((p) =>
            p.addHtmlFromFiles
              ? Object.keys(p.addHtmlFromFiles)
                  .map((k) => p.addHtmlFromFiles[k])
                  .join("")
              : "",
          )
          .join("")}</body>`,
      )
      .replace("#PLUGINSSCRIPTS#", this.#getPluginsJS());
  };

  static #getSelectLang = (menuLang, key) =>
    `<select id="sd-langs" onchange="window.location.href = this.value;">${menuLang.map(
      (o) =>
        `<option value="${o.value}" ${key === "index" ? "selected" : ""}>${
          o.label
        }</option>`,
    )}</select></body>`;
}
