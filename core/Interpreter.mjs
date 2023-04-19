import fs from "fs";

const mainFile = `./src/main.tfs`;

export default function Interpreter() {
  if (!fs.existsSync(mainFile)) {
    console.error("🤔 main.tfs was not found");
    return;
  }
  console.log("🎉 main.tfs found, now convert");
  let template = fs.readFileSync("./core/templates/index.html", "utf-8");
  const presentation = this.sliceSlides(this.includes(mainFile));
  presentation.match(/<h1>(.)*<\/h1>/g).map((title) => {
    template = template.replace(
      "#TITLE#",
      title.replace("<h1>", "").replace("</h1>", "")
    );
  });
  template = template.replace("#SECTIONS#", presentation);
  fs.rmSync("./dist", { recursive: true, force: true });
  fs.mkdirSync("./dist");
  fs.writeFileSync("./dist/index.html", template);
}

Interpreter.prototype.includes = function (file) {
  let data = fs.readFileSync(file, "utf8");
  [...data.matchAll(/!include\(([^\()]+)\)/g)].map(
    (match) =>
      (data = data.replace(
        match[0],
        this.includes(`${file.substring(0, file.lastIndexOf("/"))}/${match[1]}`)
      ))
  );
  return data;
};

Interpreter.prototype.sliceSlides = function (presentation) {
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
};
