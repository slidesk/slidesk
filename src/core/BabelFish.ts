import dotenv from "dotenv";
import { minify } from "html-minifier-terser";
import { readdirSync, existsSync, readFileSync, lstatSync } from "node:fs";
import faviconSVG from "../templates/slidesk.svg" with { type: "text" };
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
import image from "../components/image";
import translate from "../components/translate";
import replaceAsync from "../utils/replaceAsync";
import slugify from "../utils/slugify";
import toBinary from "../utils/toBinary";
import type {
  Includes,
  SliDeskFile,
  PresentOptions,
  SliDeskPlugin,
  SliDeskTemplate,
} from "../types";
import markdownit from "markdown-it";

const { error } = console;

const md = markdownit({
  html: true,
  xhtmlOut: true,
  linkify: true,
  typographer: true,
});

class BabelFish {
  #options: PresentOptions;
  #hasNotesView: boolean;
  #hasPluginSource = false;
  #mainFile: string;
  #common_dir = "";
  #sdfPath = "";
  #customCSS = "";
  #plugins: SliDeskPlugin[] = [];
  #components: string[] = [];
  #templates: SliDeskTemplate = {};
  #cptSlide = 0;
  #customIncludes: Includes = {
    css: [],
    js: [],
  };
  #env: { [key: string]: object | string } = {};
  #favicon: { name: string; content: Uint8Array; type: string } = {
    name: "/favicon.svg",
    content: faviconSVG,
    type: "image/svg+xml",
  };

  constructor(mainFile: string, options: PresentOptions) {
    this.#options = options;
    this.#hasNotesView = options.notes ?? false;
    this.#mainFile = "";
    const sdfMainFile = Bun.file(mainFile);
    if (sdfMainFile.size === 0) {
      error("🤔 main.sdf was not found");
    } else {
      this.#mainFile = mainFile;
      this.#sdfPath = `${this.#mainFile.substring(
        0,
        this.#mainFile.lastIndexOf("/"),
      )}`;
    }
  }

  async #loadFavicon() {
    const ftypes = [
      { name: "/favicon.svg", type: "image/svg+xml" },
      { name: "/favicon.ico", type: "image/x-icon" },
      { name: "/favicon.png", type: "image/png" },
    ];
    for await (const f of ftypes) {
      if (Bun.file(`${this.#sdfPath}${f.name}`).size > 0) {
        this.#favicon = {
          name: f.name,
          content: await Bun.file(`${this.#sdfPath}${f.name}`).bytes(),
          type: f.type,
        };
      }
    }
  }

  async #loadTemplates() {
    if (existsSync(`${this.#sdfPath}/templates`))
      await Promise.all(
        readdirSync(`${this.#sdfPath}/templates`).map((template) => {
          if (template.endsWith(".sdt")) {
            this.#templates[template.replace(".sdt", "")] = readFileSync(
              `${this.#sdfPath}/templates/${template}`,
              {
                encoding: "utf-8",
              },
            );
          }
        }),
      );
  }

  async preload() {
    await this.#loadEnv();
    await this.#loadPlugins();
    await this.#loadTemplates();
    await this.#loadFavicon();
    this.#loadComponents();
  }

  async convert(): Promise<SliDeskFile> {
    if (this.#mainFile) {
      await this.preload();
      const sdf = await this.#prepareSDF(this.#mainFile);
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
        [this.#favicon.name]: {
          content: this.#favicon.content,
          headers: { "Content-Type": this.#favicon.type },
        },
        ...this.#getPluginCSS(),
        ...this.#getPluginsJS(),
        "/notes.html": {
          content: this.#getNoteView(),
          headers: { "Content-Type": "text/html" },
        },
      };
    }
    return {};
  }

  async #loadEnv() {
    const slideskEnvFile = Bun.file(
      `${this.#sdfPath}/${this.#options.conf}.env`,
    );
    if (slideskEnvFile.size !== 0) {
      const buf = await slideskEnvFile.text();
      this.#env = dotenv.parse(buf);
    }
    if (this.#env.COMMON_DIR) this.#common_dir = this.#env.COMMON_DIR as string;
  }

  async #loadPlugins() {
    await this.#loadExternalPlugins(`${this.#sdfPath}/plugins`);
    if (this.#common_dir !== "")
      await this.#loadExternalPlugins(
        `${this.#sdfPath}/${this.#common_dir}/plugins`,
      );
  }

  async #loadExternalPlugins(pluginsDir: string) {
    if (existsSync(pluginsDir))
      await Promise.all(
        readdirSync(pluginsDir).map(async (plugin) => {
          const pluginFile = Bun.file(`${pluginsDir}/${plugin}/plugin.json`);
          const exists = await pluginFile.exists();
          if (exists) {
            const json = await pluginFile.json();
            ["addHTMLFromFiles"].forEach((t, _) => {
              if (json[t]) {
                const files = json[t];
                json[t] = {};
                files.forEach((s: string, _: number) => {
                  json[t][s] = readFileSync(`${this.#sdfPath}/${s}`, {
                    encoding: "utf8",
                  });
                });
              }
            });
            this.#plugins.push({ type: "external", ...json });
          }
        }),
      );
  }

  #loadComponents() {
    const componentsDir = `${this.#sdfPath}/components`;
    if (existsSync(componentsDir)) {
      this.#components = readdirSync(componentsDir)
        .filter((item) => /.mjs$/gi.test(item))
        .map((c) => `${componentsDir}/${c}`);
    }
  }

  async #prepareSDF(mainFile: string) {
    let fusion = await this.includes(mainFile);
    // get Custom configuration
    const m = /\/::([\s\S]*)::\//m.exec(fusion);
    if (m !== null) {
      fusion = fusion.replace(m[0], "");
      this.#config(m[1]);
    }
    return fusion;
  }

  async includes(file: string): Promise<string> {
    const data = await Bun.file(file).text();
    return replaceAsync(
      `${data}\n`,
      /\n!include\(([^()]+)\)/g,
      async (_, p1) => {
        if (
          lstatSync(
            `${file.substring(0, file.lastIndexOf("/"))}/${p1}`,
          ).isDirectory()
        ) {
          const files = readdirSync(
            `${file.substring(0, file.lastIndexOf("/"))}/${p1}`,
          ).sort();
          const res: string[] = [];
          for await (const f of files)
            res.push(
              await this.includes(
                `${file.substring(0, file.lastIndexOf("/"))}/${p1}/${f}`,
              ),
            );
          return res.join("\n");
        }
        return this.includes(
          `${file.substring(0, file.lastIndexOf("/"))}/${p1}`,
        );
      },
    );
  }

  #config(data: string) {
    const lines = [...data.split("\n")].filter((l) => l.length);
    lines.forEach((line, _) => {
      if (line.startsWith("custom_css:"))
        this.#customCSS = `<link rel="stylesheet" href="${line
          .replace("custom_css:", "")
          .trim()}" />`;
      if (line.startsWith("add_styles:"))
        this.#customIncludes.css = [
          ...line.replace("add_styles:", "").split(","),
        ].map((n) => `<link rel="stylesheet" href="${n.trim()}" />`);
      if (line.startsWith("add_scripts:"))
        this.#customIncludes.js = [
          ...line.replace("add_scripts:", "").split(","),
        ].map((n) => `<script src="${n.trim()}"></script>`);
    });
  }

  async getPresentation(sdf: string) {
    let fusion = sdf;
    // comments
    fusion = comments(fusion);
    // slice & treatment
    fusion = await this.#sliceSlides(fusion);
    // custom components
    await Promise.all(
      this.#components.map(async (c) => {
        const { default: comp } = await import(c);
        fusion = comp(fusion);
      }),
    );
    // format text
    fusion = formatting(fusion, this.#env);
    // image
    fusion = image(fusion);
    return fusion;
  }

  async #sliceSlides(presentation: string) {
    const promises: Promise<string>[] = [];
    [...presentation.split("\n## ")].forEach((slide, _) => {
      promises.push(Promise.resolve(this.#treatSlide(slide)));
    });
    return (await Promise.all(promises)).join("\n");
  }

  #replaceWithTemplate(tpl: string, content: string, title: string) {
    return this.#templates[tpl]
      .replace("<sd-title />", `<h2>${title}</h2>`)
      .replace("<sd-content />", content.replace(/<h2>(.*)<\/h2>/g, ""));
  }

  async #treatSlide(slide: string) {
    if (slide.trim() === "") return "";
    let classes = "";
    let slug = "";
    let timerSlide = "";
    let timerCheckpoint = "";
    let content = (
      await md.render(
        `## ${slide
          .replace(/\\r/g, "")
          .split("\n")
          .map((p) => {
            if (p.trimStart().startsWith("//@")) {
              const timer = p.replace("//@", "").replaceAll(" ", "");
              if (timer.startsWith("[]")) timerSlide = timer.replace("[]", "");
              if (timer.startsWith("<"))
                timerCheckpoint = timer.replace("<", "");
              return "";
            }
            if (p.trimStart().startsWith("//")) {
              return "";
            }
            return p;
          })
          .join("\n")}`.replace("## #", "#"),
      )
    )
      .toString()
      .replace("<h2> </h2>", "");
    const slideTitle = content.match("<h2>(.*)</h2>");
    if (slideTitle?.length) {
      const spl = slideTitle[1].toString().split(".[");
      if (spl.length !== 1) {
        classes = spl[1].replace("]", "").trim();
      }
      if (spl[0].trim() !== "") {
        slug = slugify(spl[0]);
      }
      // # in classes means template
      const tpl = (classes.split(" ").filter((c) => c.startsWith("#"))[0] ?? "")
        .replace(/.sdt$/g, "")
        .replace(/^#/g, "");
      if (tpl && this.#templates[tpl])
        content = this.#replaceWithTemplate(tpl, content, spl[0]);
      else content = content.replace(slideTitle[0], `<h2>${spl[0]}</h2>`);
    }
    const slideSlug = `!slide-${this.#cptSlide}`;
    const datas = {
      num: this.#cptSlide,
      slug: slug || slideSlug,
      source: "",
      "timer-slide": "",
      "timer-checkpoint": "",
    };
    this.#cptSlide += 1;
    if (this.#hasPluginSource) datas.source = toBinary(slide);
    if (this.#options.timers) {
      if (timerSlide !== "") datas["timer-slide"] = timerSlide;
      if (timerCheckpoint !== "") datas["timer-checkpoint"] = timerCheckpoint;
    }
    const dataset: string[] = [];
    Object.entries(datas).forEach(([key, val], _) => {
      if (val !== "") dataset.push(`data-${key}="${val}"`);
    });
    return `<section class="sd-slide ${classes
      .split(" ")
      .filter((c) => !c.startsWith("#"))
      .join(" ")}" ${dataset.join(" ")}>${content}</section>`;
  }

  #prepareTPL() {
    let template = presentationView;
    const css = [
      '<link rel="stylesheet" href="slidesk.css" />',
      ...this.#customIncludes.css,
    ];
    const js = [
      ...this.#customIncludes.js,
      '<script src="slidesk.js"></script>',
    ];
    this.#plugins.forEach((p, _) => {
      if (p.addStyles) {
        if (p.type === "internal") {
          Object.keys(p.addStyles).forEach((k, _) =>
            css.push(`<link href="${k}" rel="stylesheet"/>`),
          );
        } else {
          p.addStyles.forEach((k: string, _) =>
            css.push(`<link href="${k}" rel="stylesheet"/>`),
          );
        }
      }
      if (p.addScripts) {
        if (p.type === "internal") {
          Object.keys(p.addScripts).forEach((k, _) =>
            js.push(`<script src="${k}"></script>`),
          );
        } else {
          p.addScripts.forEach((k: string, _) =>
            js.push(`<script src="${k}"></script>`),
          );
        }
      }
    });
    template = template.replace(
      "#STYLES#",
      `${css.join("")}${this.#customCSS}`,
    );
    template = template.replace("#SCRIPTS#", `${js.join("")}`);
    template = template.replace("#FAVICON#", this.#favicon.name);
    template = template.replace("#FAVICON_TYPE#", this.#favicon.type);
    return template;
  }

  async #generateHTML(presentation: string, template: string) {
    const langFiles = readdirSync(this.#sdfPath).filter((item) =>
      /.lang.json$/gi.test(item),
    );
    let content = "";
    if (langFiles.length) {
      let translations: object | null = null;
      await Promise.all(
        langFiles.map(async (lang) => {
          const langSlug = lang.replace(".lang.json", "");
          const translationJSON = await Bun.file(
            `${this.#sdfPath}/${lang}`,
          ).json();
          if (
            this.#options.lang === langSlug ||
            (translationJSON.default && translations === null)
          )
            translations = translationJSON;
        }),
      );
      content = await this.#polish(
        translate(presentation, translations),
        template,
      );
    } else {
      content = await this.#polish(presentation, template);
    }
    return {
      "/index.html": {
        content,
        headers: {
          "Content-Type": "text/html",
        },
      },
    };
  }

  async #polish(presentation: string, template: string) {
    let tpl = template;
    if (this.#env.TITLE)
      tpl = tpl.replace("#TITLE#", this.#env.TITLE.toString());
    else
      [...presentation.matchAll(/<h1>(.*)<\/h1>/g)].forEach((title, _) => {
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

    return tpl.replace(
      "</body>",
      `${this.#plugins.map((p) => p.addHTML ?? "").join("")}${this.#plugins
        .map((p) =>
          p.addHTMLFromFiles
            ? Object.keys(p.addHTMLFromFiles)
                .map((k) => p.addHTMLFromFiles[k])
                .join("")
            : "",
        )
        .join("")}</body>`,
    );
  }

  #getCSS() {
    return presentationStyles.replace(
      ":root {",
      `:root { --animationTimer: ${this.#options.transition}ms; `,
    );
  }

  #getJS() {
    return `
    window.slidesk = {
      currentSlide: 0,
      slides: [],
      animationTimer: ${this.#options.transition},
      onSlideChange: function() {${this.#plugins
        .map((p) => p.onSlideChange ?? "")
        .join(";")}},
      env: ${JSON.stringify(this.#env)},
      cwd: '${process.cwd()}/',
      lastAction: ""
    };
    ${
      !this.#options.save
        ? `window.slidesk.io = new WebSocket(\`ws\${
            window.location.protocol.includes('https') ? "s" : ""
          }://\${window.location.host}/ws\`);`
        : "window.slidesk.save = true;"
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
        ${this.#plugins.map((p) => p.onSpeakerViewSlideChange ?? "").join(";")}
      }
    };
    window.slidesk.io = new WebSocket("ws${
      this.#env?.HTTPS === "true" ? "s" : ""
    }://${this.#options.domain}:${this.#options.port}/ws");
    ${notesScript}
    `;
  }

  #getPluginCSS() {
    const css: SliDeskFile = {};
    this.#plugins.forEach((p, _) => {
      if (p.type === "internal") {
        if (p.addStyles)
          Object.keys(p.addStyles).forEach((k, _) => {
            css[k.replace("./", "/")] = {
              content: p.addStyles[k],
              headers: { "Content-type": "text/css" },
            };
          });
        if (this.#hasNotesView && p.addSpeakerStyles)
          Object.keys(p.addSpeakerStyles).forEach((k, _) => {
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
    const js: SliDeskFile = {};
    this.#plugins.forEach((p, _) => {
      if (p.type === "internal") {
        if (p.addScripts)
          Object.keys(p.addScripts).forEach((k: string, _) => {
            js[k.replace("./", "/")] = {
              content: p.addScripts[k],
              headers: { "Content-type": "application/javascript" },
            };
          });
        if (this.#hasNotesView && p.addSpeakerScripts)
          Object.keys(p.addSpeakerScripts).forEach((k, _) => {
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
      ...this.#customIncludes.css,
    ];
    const js = ['<script src="slidesk-notes.js"></script>'];
    this.#plugins.forEach((p, _) => {
      if (p.addSpeakerStyles) {
        if (p.type === "internal") {
          Object.keys(p.addSpeakerStyles).forEach((k, _) =>
            css.push(`<link href="${k}" rel="stylesheet" />`),
          );
        } else {
          p.addSpeakerStyles.forEach((k: string, _) =>
            css.push(`<link href="${k}" rel="stylesheet" />`),
          );
        }
      }
      if (p.addSpeakerScripts) {
        if (p.type === "internal") {
          Object.keys(p.addSpeakerScripts).forEach((k, _) =>
            js.push(`<script src="${k}"></script>`),
          );
        } else {
          p.addSpeakerScripts.forEach((k: string, _) =>
            js.push(`<script src="${k}"></script>`),
          );
        }
      }
    });
    template = template.replace(
      "#STYLES#",
      `${css.join("")}${this.#customCSS}`,
    );
    template = template.replace("#SCRIPTS#", `${js.join("")}`);
    return template;
  }
}

export default BabelFish;
