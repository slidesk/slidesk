import { existsSync, readFileSync } from "fs";
import { minify } from "html-minifier-terser";

const animationTimer = 300;

const html = `<!DOCTYPE html>
<html>
  <head>
    <link rel="icon" href="/favicon.svg">
    <title>#TITLE#</title>
    <style>#STYLE#</style>
  </head>
  <body>
    <main>#SECTIONS#</main>
    #SCRIPT#
  </body>
</html>`;

const css = `
:root {
  font-family: SegoeUI, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

html, body, main {
  width: 100%;
  height: 100%;
  margin: 0;
}

main {
  position: relative;
  overflow: hidden;
}

section {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translateX(100%);
  transition: all ${animationTimer}ms ease;
}

section.no-transition {
  transition-duration: 0ms;
}

section.current {
  transform: translateX(0);
}

section.past {
  transform: translateX(-100%);
}
`;
const js = `
<script type="module">
  import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";
  const socket = io();
  socket.on("reload", () => {
    location.reload();
  });
  window.talkflow = {
    currentSlide: 0,
    slides: []
  };

  const cleanOldSlide = (id) => {
    window.talkflow.slides[id].classList.remove('current', 'no-transition');
    setTimeout(() => {
      window.talkflow.slides[id].querySelectorAll('img').forEach((img) => {
        img.setAttribute('data-src', img.getAttribute('src'));
        img.removeAttribute('src');
      })
    }, ${animationTimer});
  }

  const changeSlide = () => {
    window.talkflow.slides[window.talkflow.currentSlide].classList.remove('past');
    window.talkflow.slides[window.talkflow.currentSlide].classList.add('current');
    window.location.hash = "/" + window.talkflow.slides[window.talkflow.currentSlide].querySelector('h2').getAttribute('data-slug');
    window.talkflow.slides[window.talkflow.currentSlide].querySelectorAll('img').forEach((img) => {
      img.setAttribute('src', img.getAttribute('data-src'));
      img.removeAttribute('data-src');
    });
  }

  window.onload = () => {
    window.talkflow.slides = document.querySelectorAll('.slide');
    window.talkflow.slides[window.talkflow.currentSlide].classList.add('current', 'no-transition');
    document.addEventListener("keydown", (e) => {
      if (e.key == "ArrowLeft") {
        if (window.talkflow.currentSlide != 0) {
          cleanOldSlide(window.talkflow.currentSlide);
          window.talkflow.currentSlide--;
          changeSlide();
        }
      }
      else if (e.key == "ArrowRight" || e.key == " ") {
        if (window.talkflow.currentSlide != window.talkflow.slides.length - 1) {
            cleanOldSlide(window.talkflow.currentSlide)
            window.talkflow.slides[window.talkflow.currentSlide].classList.add('past');
            window.talkflow.currentSlide++;
            changeSlide();
        }
      }
    })
  };
</script>
`;

export default class Interpreter {
  constructor(mainFile) {
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
      template = template.replace("#STYLE#", css);
      template = template.replace("#SCRIPT#", js);
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
            else if (i == 0)
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
