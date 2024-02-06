/* eslint-disable no-undef */
import dotenv from "dotenv";
import { minify } from "html-minifier-terser";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import faviconSVG from "../templates/slidesk.svg.txt";
import {
  view as presentationView,
  script as presentationScript,
  styles as presentationStyles,
} from "../templates/present";
import {
  view as notesView,
  script as notesScript,
  styles as notesStyles,
} from "../templates/notes";
import comments from "../components/comments";
import formatting from "../components/formatting";
import getSelectLang from "../components/getSelectLang";
import image from "../components/image";
import list from "../components/list";
import translate from "../components/translate";
import pluginsJSON from "../plugins.json";
import replaceAsync from "../utils/replaceAsync";
import slugify from "../utils/slugify";
import toBinary from "../utils/toBinary";

const { error } = console;

class BabelFish {
  constructor(mainFile, options) {
    this.options = options;
    this.hasNotesView = options.notes;
    this.mainFile = "";
    const sdfMainFile = Bun.file(mainFile);
    if (sdfMainFile.size === 0) {
      error("🤔 main.sdf was not found");
    } else {
      this.mainFile = mainFile;
      this.sdfPath = `${this.mainFile.substring(
        0,
        this.mainFile.lastIndexOf("/"),
      )}`;
      this.#initVariables();
    }
  }

  async preload() {
    await this.#loadEnv();
    await this.#loadPlugins();
    this.#loadComponents();
  }

  async convert() {
    if (this.mainFile) {
      await this.preload();
      const sdf = await this.#prepareSDF(this.mainFile);
      return {
        ...(await this.#generateHTML(
          await this.getPresentation(sdf),
          this.#prepareTPL(),
        )),
        "/slidesk.css": {
          content: this.#getCSS(),
          headers: { "Content-type": "text/css" },
        },
        "/slidesk-notes.css": {
          content: notesStyles,
          headers: { "Content-type": "text/css" },
        },
        "/slidesk.js": {
          content: this.#getJS(),
          headers: { "Content-type": "application/javascript" },
        },
        "/slidesk-notes.js": {
          content: this.#getNotesJS(),
          headers: { "Content-type": "application/javascript" },
        },
        "/favicon.svg": {
          content: faviconSVG,
          headers: { "Content-Type": "image/svg+xml" },
        },
        ...this.#getPluginCSS(),
        ...this.#getPluginsJS(),
        "/notes.html": {
          content: this.#getNoteView(),
          headers: { "Content-Type": "text/html" },
        },
      };
    }
    return null;
  }

  #initVariables() {
    this.customCSS = "";
    this.timerSlide = "";
    this.timerCheckpoint = "";
    this.plugins = [];
    this.components = [];
    this.cptSlide = 0;
    this.customIncludes = {
      css: [],
      js: [],
    };
  }

  async #loadEnv() {
    const slideskEnvFile = Bun.file(`${this.sdfPath}/${this.options.conf}.env`);
    if (slideskEnvFile.size !== 0) {
      const buf = await slideskEnvFile.text();
      globalThis.env = dotenv.parse(buf);
    }
  }

  async #loadPlugins() {
    this.#internalPlugins();
    await this.#externalPlugins();
  }

  #internalPlugins() {
    if (globalThis.env?.PLUGINS) {
      [...globalThis.env.PLUGINS.split(",")].forEach((p) => {
        const pl = p.trim();
        if (pl === "source") this.hasPluginSource = true;
        if (pluginsJSON[pl]) {
          this.plugins.push({
            type: "internal",
            ...pluginsJSON[pl],
          });
        }
      });
    }
  }

  async #externalPlugins() {
    const pluginsDir = `${this.sdfPath}/plugins`;
    if (existsSync(pluginsDir))
      await Promise.all(
        readdirSync(pluginsDir).map(async (plugin) => {
          const pluginFile = Bun.file(`${pluginsDir}/${plugin}/plugin.json`);
          const exists = await pluginFile.exists();
          if (exists) {
            const json = await pluginFile.json();
            ["addHTMLFromFiles"].forEach((t) => {
              if (json[t]) {
                const files = json[t];
                json[t] = {};
                files.forEach((s) => {
                  json[t][s] = readFileSync(`${this.sdfPath}/${s}`, {
                    encoding: "utf8",
                  });
                });
              }
            });
            this.plugins.push({ type: "external", ...json });
          }
        }),
      );
  }

  #loadComponents() {
    const componentsDir = `${this.sdfPath}/components`;
    if (existsSync(componentsDir)) {
      this.components = readdirSync(componentsDir)
        .filter((item) => /.mjs$/gi.test(item))
        .map((c) => `${componentsDir}/${c}`);
    }
  }

  async #prepareSDF(mainFile) {
    let fusion = await this.includes(mainFile);
    // get Custom configuration
    const m = /\/::([\s\S]*)::\//m.exec(fusion);
    if (m !== null) {
      fusion = fusion.replace(m[0], "");
      this.#config(m[1]);
    }
    return fusion;
  }

  async includes(file) {
    const data = await Bun.file(file).text();
    return replaceAsync(data, /\n!include\(([^()]+)\)/g, async (_, p1) =>
      this.includes(`${file.substring(0, file.lastIndexOf("/"))}/${p1}`),
    );
  }

  #config(data) {
    const lines = [...data.split("\n")].filter((l) => l.length);
    lines.forEach((line) => {
      if (line.startsWith("custom_css:"))
        this.customCSS = `<link rel="stylesheet" href="${line
          .replace("custom_css:", "")
          .trim()}" />`;
      if (line.startsWith("add_styles:"))
        this.customIncludes.css = [
          ...line.replace("add_styles:", "").split(","),
        ].map((n) => `<link rel="stylesheet" href="${n.trim()}" />`);
      if (line.startsWith("add_scripts:"))
        this.customIncludes.js = [
          ...line.replace("add_scripts:", "").split(","),
        ].map((n) => `<script src="${n.trim()}"></script>`);
    });
  }

  async getPresentation(sdf) {
    let fusion = sdf;
    // comments
    fusion = comments(fusion);
    // slice & treatment
    fusion = this.#sliceSlides(fusion);
    // custom components
    await Promise.all(
      this.components.map(async (c) => {
        const { default: comp } = await import(c);
        fusion = comp(fusion);
      }),
    );
    // format text
    fusion = formatting(fusion);
    // image
    fusion = image(fusion);
    return fusion;
  }

  #sliceSlides(presentation) {
    return [...presentation.split("\n## ")]
      .map((slide) => this.#treatSlide(slide))
      .join("\n");
  }

  #treatSlide(slide) {
    if (slide.trim() === "") return "";
    let classes = "";
    let slug = "";
    this.timerSlide = "";
    this.timerCheckpoint = "";
    const content = slide
      .replace(/\\r/g, "")
      .split("\n\n")
      .map((paragraph, p) => {
        const par = this.#paragraph(paragraph);
        if (p === 0) {
          const spl = [...par.replace(/<(\/?)p>/g, "").split(".[")];
          if (spl.length !== 1) {
            classes = spl[1].replace("]", "");
          }
          if (spl[0].trim() !== "") {
            slug = slugify(spl[0]);
            return `<h2>${spl[0]}</h2>`;
          }
        }
        return par.replace(/<p>\.\[[^\]]+\] <\/p>/g, "");
      })
      .join("\n\n");
    const datas = {};
    const slideSlug = this.cptSlide ? `!slide-${this.cptSlide}` : "";
    datas.num = this.cptSlide;
    this.cptSlide += 1;
    datas.slug = slug || slideSlug;
    if (this.hasPluginSource) datas.source = toBinary(slide);
    if (this.options.timers) {
      if (this.timerSlide !== "") datas["timer-slide"] = this.timerSlide;
      if (this.timerCheckpoint !== "")
        datas["timer-checkpoint"] = this.timerCheckpoint;
    }
    const dataset = [];
    Object.entries(datas).forEach(([key, val]) => {
      dataset.push(`data-${key}="${val}"`);
    });
    return `<section class="sd-slide ${classes}" ${dataset.join(
      " ",
    )}>${content}</section>`;
  }

  #paragraph(paragraph) {
    const par = paragraph.trimStart();
    switch (true) {
      case par.startsWith("- "):
        return list(par, 1, "ul");
      case par.startsWith(". "):
        return list(par, 1, "ol");
      case par.startsWith("<"):
        return par;
      case par.startsWith("//@"):
        return this.#timers(par);
      case par.startsWith("# "):
        return `<h1>${par.replace(/^# /, "").trim()}</h1>`;
      case par.startsWith("// "):
        return "";
      default:
        break;
    }
    if (par.length) return `<p>${par} </p>`;
    return "";
  }

  #timers(data) {
    // timers
    const timer = data.replace("//@", "").replaceAll(" ", "");
    if (timer.startsWith("[]")) this.timerSlide = timer.replace("[]", "");
    if (timer.startsWith("<")) this.timerCheckpoint = timer.replace("<", "");
    return "";
  }

  #prepareTPL() {
    let template = presentationView;
    const css = [
      '<link rel="stylesheet" href="slidesk.css" />',
      ...this.customIncludes.css,
    ];
    const js = [
      ...this.customIncludes.js,
      '<script src="slidesk.js"></script>',
    ];
    this.plugins.forEach((p) => {
      if (p.addStyles) {
        if (p.type === "internal") {
          Object.keys(p.addStyles).forEach((k) =>
            css.push(`<link href="${k}" rel="stylesheet"/>`),
          );
        } else {
          p.addStyles.forEach((k) =>
            css.push(`<link href="${k}" rel="stylesheet"/>`),
          );
        }
      }
      if (p.addScripts) {
        if (p.type === "internal") {
          Object.keys(p.addScripts).forEach((k) =>
            js.push(`<script src="${k}"></script>`),
          );
        } else {
          p.addScripts.forEach((k) => js.push(`<script src="${k}"></script>`));
        }
      }
    });
    template = template.replace("#STYLES#", `${css.join("")}${this.customCSS}`);
    template = template.replace("#SCRIPTS#", `${js.join("")}`);
    return template;
  }

  async #generateHTML(presentation, template) {
    const langFiles = readdirSync(this.sdfPath).filter((item) =>
      /.lang.json$/gi.test(item),
    );
    const languages = {};
    if (langFiles.length) {
      const menuLang = [];
      await Promise.all(
        langFiles.map(async (lang) => {
          const langSlug = lang.replace(".lang.json", "");
          const translationJSON = await Bun.file(
            `${this.sdfPath}/${lang}`,
          ).json();
          menuLang.push({
            value: translationJSON.default ? "/" : `${langSlug}.html`,
            label: langSlug,
          });
          languages[
            `/${translationJSON.default ? "index" : `${langSlug}`}.html`
          ] = {
            content: await this.#polish(
              translate(presentation, translationJSON),
              template,
            ),
            headers: {
              "Content-Type": "text/html",
            },
          };
        }),
      );
      // add menu lang
      Object.keys(languages).forEach((key) => {
        languages[key].content = languages[key].content.replace(
          "</body>",
          getSelectLang(menuLang, key),
        );
      });
    } else {
      languages["/index.html"] = {
        content: await this.#polish(presentation, template),
        headers: {
          "Content-Type": "text/html",
        },
      };
    }
    return languages;
  }

  async #polish(presentation, template) {
    let tpl = template;
    [...presentation.matchAll(/<h1>(.*)<\/h1>/g)].forEach((title) => {
      tpl = tpl.replace("#TITLE#", title[1]);
    });
    tpl = tpl.replace("#TITLE#", "SliDesk");
    tpl = tpl.replace("#SECTIONS#", presentation);

    tpl = await minify(tpl, {
      collapseWhitespace: true,
      removeEmptyElements: false,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      removeAttributeQuotes: true,
    });

    return tpl
      .replace(
        "</body>",
        `${this.plugins.map((p) => p.addHTML ?? "").join("")}${this.plugins
          .map((p) =>
            p.addHTMLFromFiles
              ? Object.keys(p.addHTMLFromFiles)
                  .map((k) => p.addHTMLFromFiles[k])
                  .join("")
              : "",
          )
          .join("")}</body>`,
      )
      .replace("#PLUGINSSCRIPTS#", this.#getPluginsJS());
  }

  #getCSS() {
    return `:root { --animationTimer: ${this.options.transition}ms; }${presentationStyles}`;
  }

  #getJS() {
    return `
    window.slidesk = {
      currentSlide: 0,
      slides: [],
      animationTimer: ${this.options.transition},
      onSlideChange: function() {${this.plugins
        .map((p) => p.onSlideChange ?? "")
        .join(";")}},
      env: ${JSON.stringify(globalThis.env)},
      cwd: '${process.cwd()}/',
      lastAction: ""
    };
    ${
      !this.options.save
        ? `window.slidesk.io = new WebSocket(\`ws${
            globalThis.env?.HTTPS === "true" ? "s" : ""
          }://\${window.location.host}/ws\`);`
        : ""
    }
    ${
      !this.hasNotesView
        ? `
      document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          window.slidesk.previous();
        } else if (e.key === "ArrowRight") {
          window.slidesk.next();
        }
      });
      `
        : ""
    }
    ${presentationScript}`;
  }

  #getNotesJS() {
    return `
    window.slidesk = {
      io: {},
      timer: document.querySelector("#sd-sv-timer"),
      subtimer: document.querySelector("#sd-sv-subtimer"),
      scrollPosition: 0,
      cwd: '${process.cwd()}/',
      onSpeakerViewSlideChange: () => {
        window.slidesk.scrollPosition = 0;
        ${this.plugins.map((p) => p.onSpeakerViewSlideChange ?? "").join(";")}
      }
    };
    window.slidesk.io = new WebSocket("ws${
      globalThis.env?.HTTPS === "true" ? "s" : ""
    }://${this.options.domain}:${this.options.port}/ws");
    ${notesScript}
    `;
  }

  #getPluginCSS() {
    const css = {};
    this.plugins.forEach((p) => {
      if (p.type === "internal") {
        if (p.addStyles)
          Object.keys(p.addStyles).forEach((k) => {
            css[k.replace("./", "/")] = {
              content: p.addStyles[k],
              headers: { "Content-type": "text/css" },
            };
          });
        if (this.hasNotesView && p.addSpeakerStyles)
          Object.keys(p.addSpeakerStyles).forEach((k) => {
            css[k.replace("./", "/")] = {
              content: p.addSpeakerStyles[k],
              headers: { "Content-type": "text/css" },
            };
          });
      }
    });
    return css;
  }

  #getPluginsJS() {
    const js = {};
    this.plugins.forEach((p) => {
      if (p.type === "internal") {
        if (p.addScripts)
          Object.keys(p.addScripts).forEach((k) => {
            js[k.replace("./", "/")] = {
              content: p.addScripts[k],
              headers: { "Content-type": "application/javascript" },
            };
          });
        if (this.hasNotesView && p.addSpeakerScripts)
          Object.keys(p.addSpeakerScripts).forEach((k) => {
            js[k.replace("./", "/")] = {
              content: p.addSpeakerScripts[k],
              headers: { "Content-type": "application/javascript" },
            };
          });
      }
    });
    return js;
  }

  #getNoteView() {
    let template = notesView;
    const css = [
      '<link rel="stylesheet" href="slidesk.css" />',
      '<link rel="stylesheet" href="slidesk-notes.css" />',
    ];
    const js = ['<script src="slidesk-notes.js"></script>'];
    this.plugins.forEach((p) => {
      if (p.addSpeakerStyles) {
        if (p.type === "internal") {
          Object.keys(p.addSpeakerStyles).forEach((k) =>
            css.push(`<link href="${k}" rel="stylesheet" />`),
          );
        } else {
          p.addSpeakerStyles.forEach((k) =>
            css.push(`<link href="${k}" rel="stylesheet" />`),
          );
        }
      }
      if (p.addSpeakerScripts) {
        if (p.type === "internal") {
          Object.keys(p.addSpeakerScripts).forEach((k) =>
            js.push(`<script src="${k}"></script>`),
          );
        } else {
          p.addSpeakerScripts.forEach((k) =>
            js.push(`<script src="${k}"></script>`),
          );
        }
      }
    });
    template = template.replace("#STYLES#", `${css.join("")}${this.customCSS}`);
    template = template.replace("#SCRIPTS#", `${js.join("")}`);
    return template;
  }
}

export default BabelFish;
