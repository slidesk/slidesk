/* eslint-disable no-undef */
import dotenv from "dotenv";
import { minify } from "html-minifier-terser";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import layoutHTML from "../templates/layout.html.txt";
import themeCSS from "../templates/styles.css.txt";
import mainJS from "../templates/script.js.txt";
import faviconSVG from "../templates/slidesk.svg.txt";
import speakerViewHTML from "../templates/notes/layout.html.txt";
import speakerViewCSS from "../templates/notes/styles.css.txt";
import speakerViewJS from "../templates/notes/script.js.txt";
import slugify from "../utils/slugify";
import image from "../components/image";
import comments from "../components/comments";
import list from "../components/list";
import pluginsJSON from "../plugins.json";

const { error } = console;

let classes = "";
let timerSlide = "";
let timerCheckpoint = "";
let slug = null;
let sdfPath = "";
let plugins = [];
let components = [];
let hasPluginSource = false;
let env = {};
let customCSS = "";
let hasNotesView = false;
let cptSlide = 0;

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
    hasNotesView = options.notes;
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
    return {
      ...(await this.#generateHTML(
        await this.#getPresentation(sdf, options),
        this.#prepareTPL(),
        options,
      )),
      "/slidesk.css": {
        content: this.#getCSS(options),
        headers: { "Content-type": "text/css" },
      },
      "/slidesk-notes.css": {
        content: speakerViewCSS,
        headers: { "Content-type": "text/css" },
      },
      "/slidesk.js": {
        content: this.#getJS(options),
        headers: { "Content-type": "application/javascript" },
      },
      "/slidesk-notes.js": {
        content: this.#getNotesJS(options),
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
  };

  static #getRealPath = (mainFile) => {
    sdfPath = `${mainFile.substring(0, mainFile.lastIndexOf("/"))}`;
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
    cptSlide = 0;
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
          plugins.push({
            type: "internal",
            ...pluginsJSON[pl],
          });
        }
      });
    }
  };

  static #externalPlugins = async () => {
    const pluginsDir = `${sdfPath}/plugins`;
    if (existsSync(pluginsDir))
      await Promise.all(
        readdirSync(pluginsDir).map(async (plugin) => {
          const pluginPath = `${pluginsDir}/${plugin}/plugin.json`;
          const pluginFile = Bun.file(pluginPath);
          const exists = await pluginFile.exists();
          if (exists) {
            const json = await pluginFile.json();
            ["addHTMLFromFiles"].forEach((t) => {
              if (json[t]) {
                const files = json[t];
                json[t] = {};
                files.forEach((s) => {
                  json[t][s] = readFileSync(`${sdfPath}/${s}`, {
                    encoding: "utf8",
                  });
                });
              }
            });
            plugins.push({ type: "external", ...json });
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

  static #getJS = (options) => `
  window.slidesk = {
    currentSlide: 0,
    slides: [],
    animationTimer: ${options.transition},
    onSlideChange: function() {${plugins
      .map((p) => p.onSlideChange ?? "")
      .join("")}},
    env: ${JSON.stringify(env)},
    cwd: '${process.cwd()}/',
    lastAction: ""
  };
  ${
    !options.save
      ? `window.slidesk.io = new WebSocket(\`ws${
          env.HTTPS === "true" ? "s" : ""
        }://\${window.location.host}/ws\`);`
      : ""
  }
  ${
    !hasNotesView
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
  ${mainJS}`;

  static #getNotesJS = (options) => `
window.slidesk = {
  io: {},
  timer: document.querySelector("#sd-sv-timer"),
  subtimer: document.querySelector("#sd-sv-subtimer"),
  scrollPosition: 0,
  cwd: '${process.cwd()}/',
  onSpeakerViewSlideChange: () => {
    window.slidesk.scrollPosition = 0;
    ${plugins.map((p) => p.onSpeakerViewSlideChange ?? "").join(";")}
  }
};
window.slidesk.io = new WebSocket("ws${env.HTTPS === "true" ? "s" : ""}://${
    options.domain
  }:${options.port}/ws");
${speakerViewJS}
`;

  static #getCSS = (options) =>
    `:root { --animationTimer: ${options.transition}ms; }${themeCSS}`;

  static #getPluginCSS = () => {
    const css = {};
    plugins.forEach((p) => {
      if (p.type === "internal") {
        if (p.addStyles)
          Object.keys(p.addStyles).forEach((k) => {
            css[k.replace("./", "/")] = {
              content: p.addStyles[k],
              headers: { "Content-type": "text/css" },
            };
          });
        if (hasNotesView && p.addSpeakerStyles)
          Object.keys(p.addSpeakerStyles).forEach((k) => {
            css[k.replace("./", "/")] = {
              content: p.addSpeakerStyles[k],
              headers: { "Content-type": "text/css" },
            };
          });
      }
    });
    return css;
  };

  static #getPluginsJS = () => {
    const js = {};
    plugins.forEach((p) => {
      if (p.type === "internal") {
        if (p.addScripts)
          Object.keys(p.addScripts).forEach((k) => {
            js[k.replace("./", "/")] = {
              content: p.addScripts[k],
              headers: { "Content-type": "application/javascript" },
            };
          });
        if (hasNotesView && p.addSpeakerScripts)
          Object.keys(p.addSpeakerScripts).forEach((k) => {
            js[k.replace("./", "/")] = {
              content: p.addSpeakerScripts[k],
              headers: { "Content-type": "application/javascript" },
            };
          });
      }
    });
    return js;
  };

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

  static #prepareTPL = () => {
    let template = layoutHTML;
    const css = ['<link rel="stylesheet" href="slidesk.css" />'];
    const js = ['<script src="slidesk.js"></script>'];
    plugins.forEach((p) => {
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
    template = template.replace("#STYLES#", `${css.join("")}${customCSS}`);
    template = template.replace("#SCRIPTS#", `${js.join("")}`);
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
      .map((slide) => this.#treatSlide(slide, options))
      .join("\n");

  static #paragraph = (paragraph, p) => {
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

  static #treatSlide = (slide, options) => {
    if (slide.trim() === "") return "";
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
    const slideSlug = cptSlide ? `!slide-${cptSlide}` : "";
    datas.num = cptSlide;
    cptSlide += 1;
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
    const reg = /s?:\/\/([a-zA-Z0-9.-]+(:\d+)?([a-zA-Z0-9._\-/~=?@]*\/?))/g;
    return data
      .split("http")
      .map((d, i) => {
        if (i === 0) return d;
        if (!d.match(reg)) return `http${d}`;
        if (d.indexOf('">') !== -1) return `http${d}`;
        let nd = d;
        [...nd.matchAll(reg)].forEach((m) => {
          nd = nd.replace(
            m[0],
            `<a href="http${m[0]}" target="_blank" rel="noopener">http${m[0]}</a>`,
          );
        });
        return nd;
      })
      .join("");
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

  static #envVariables = (data) =>
    [...data.split("++")]
      .map((t, i) => {
        if (i % 2) return env[t] || "";
        return t;
      })
      .join("");

  static #formatting = (data) =>
    [...data.split("\n")]
      .map((l) => {
        let nl = l;
        nl = this.#grammar(nl);
        nl = this.#envVariables(nl);
        nl = this.#links(nl);
        return nl;
      })
      .join("\n");

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
            value: translationJSON.default ? "/" : `${langSlug}.html`,
            label: langSlug,
          });
          languages[
            `/${translationJSON.default ? "index" : `${langSlug}`}.html`
          ] = {
            content: await this.#polish(
              this.#translate(presentation, translationJSON),
              template,
              options,
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
          this.#getSelectLang(menuLang, key),
        );
      });
    } else {
      languages["/index.html"] = {
        content: await this.#polish(presentation, template, options),
        headers: {
          "Content-Type": "text/html",
        },
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
        `${plugins.map((p) => p.addHTML ?? "").join("")}${plugins
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
  };

  static #getSelectLang = (menuLang, key) =>
    `<select id="sd-langs" onchange="window.location.href = this.value;">${menuLang.map(
      (o) =>
        `<option value="${o.value}" ${key === "index.html" ? "selected" : ""}>${
          o.label
        }</option>`,
    )}</select></body>`;

  static #getNoteView = () => {
    let template = speakerViewHTML;
    const css = [
      '<link rel="stylesheet" href="slidesk.css" />',
      '<link rel="stylesheet" href="slidesk-notes.css" />',
    ];
    const js = ['<script src="slidesk-notes.js"></script>'];
    plugins.forEach((p) => {
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
    template = template.replace("#STYLES#", `${css.join("")}${customCSS}`);
    template = template.replace("#SCRIPTS#", `${js.join("")}`);
    return template;
  };
}
