import fs from "fs";
import { minify } from "html-minifier-terser";

const html = `<!DOCTYPE html>
<html>
  <head>
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
  transition: all 300ms ease;
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
</script>
<script>
window.talkflow = {
  currentSlide: 0,
  slides: []
};

window.onload = () => {
  window.talkflow.slides = document.querySelectorAll('.slide');
  window.talkflow.slides[window.talkflow.currentSlide].classList.add('current', 'no-transition');
  
};
</script>
`;

export default class Interpreter {
  constructor(mainFile) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(mainFile)) {
        reject("🤔 main.tfs was not found");
      }
      let template = html;
      const presentation = this.#sliceSlides(this.#includes(mainFile));
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
    let data = fs.readFileSync(file, "utf8");
    [...data.matchAll(/!include\(([^\()]+)\)/g)].map(
      (match) =>
        (data = data.replace(
          match[0],
          this.includes(
            `${file.substring(0, file.lastIndexOf("/"))}/${match[1]}`
          )
        ))
    );
    return data;
  }

  #sliceSlides(presentation) {
    return presentation
      .split("## ")
      .map((slide) =>
        slide
          .split("\n\n")
          .map((paragraph, i) => {
            let data = paragraph.replace("\n", "<br />");
            if (data.startsWith("# "))
              return `<h1>${data.replace("# ", "")}</h1>`;
            if (i == 0)
              return `<h2 data-slug="${data
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "")}">${data}</h2>`;
            if (data.length) return `<p>${data}</p>`;
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
          new RegExp(
            `${couple[0]}${couple[0]}([^\\${couple[0]}]+)${couple[0]}${couple[0]}`,
            "gm"
          )
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
}
