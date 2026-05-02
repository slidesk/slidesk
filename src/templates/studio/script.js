let zoom = 0;
const $previews = document.getElementById("previews");
const $workbench = document.getElementById("workbench");
const $saveSlide = document.getElementById("saveSlide");

const decodeComments = (content) =>
  atob(content)
    .replaceAll(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .split("<br/>")
    .join("\n");

const encodeComments = (content) =>
  btoa(
    encodeURIComponent(
      content
        .replace("/*", "")
        .replace("*/", "")
        .replaceAll(
          /[&<>"'` !@$%()=+{}[\]]/g,
          (match) => `&#${match.codePointAt(0)};`,
        )
        .split("\n")
        .slice(1)
        .join("<br/>"),
    ).replaceAll(/%([a-f0-9]{2})/gi, (_, $1) =>
      String.fromCodePoint(Number.parseInt($1, 16)),
    ),
  );

const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});
turndownService.addRule("comments", {
  filter: ["aside"],
  replacement: (content, node) => {
    if (node.classList.contains("sd-notes"))
      return `/*\n${decodeComments(content)}\n*/`;
    return node.outerHTML;
  },
});
turndownService.addRule("image", {
  filter: ["figure"],
  replacement: (_content, node) => {
    const html = node.outerHTML;
    const figureRegex =
      /<figure class="sd-img([^"]*)"([^>]*)>\s*<img src="([^"]*)" alt="([^"]*)"(?:\s+width="([^"]*)")?(?:\s+height="([^"]*)")?[^>]*>\s*<figcaption([^>]*)>([^<]*)<\/figcaption>\s*<\/figure>/;

    const match = html.match(figureRegex);
    if (!match) return html;

    const [_full, classc, styleAttr, src, alt, width, height, figcaptionAttrs] =
      match;

    const trimmedClass = classc.trim();
    const styleMatch = styleAttr.match(/style="([^"]*)"/);
    const style = styleMatch ? styleMatch[1] : "";

    let optionals = "";
    if (trimmedClass !== "") {
      optionals = `[${trimmedClass}]`;
    } else if (style !== "") {
      optionals = style;
    }

    const captionHidden = figcaptionAttrs.includes("display: none");
    const caption = captionHidden ? "false" : "true";

    const parts = [src, alt, width ?? "", height ?? "", optionals, caption];

    let end = parts.length - 1;
    while (end > 1 && parts[end] === "") end--;
    const trimmedParts = parts.slice(0, end + 1);

    return `!image(${trimmedParts.join(",")})`;
  },
});
turndownService.keep(["div", "iframe"]);

$saveSlide.addEventListener("click", async () => {
  const $slide = $workbench.querySelector("article.sd-slide");
  const md = turndownService.turndown($slide.innerHTML);
  await fetch("/api/slide/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: $slide.dataset.file,
      classes: $slide.dataset.classes,
      num: $slide.dataset.num,
      content: md,
    }),
  });
  await fetchSlides();
  setTimeout(() => {
    [...$previews.querySelectorAll("article")]
      .find(
        (a) =>
          a.dataset.file === $slide.dataset.file &&
          a.dataset.num == $slide.dataset.num,
      )
      ?.classList.add("studio-selected");
  }, 10);
});

const addPresentationStyles = async () => {
  const styles = await (await fetch("/api/styles")).json();
  styles.css?.forEach((s) => {
    document.head.innerHTML += s;
  });
};

const makeSlidePreview = (slide) => {
  const art = document.createElement("article");
  art.classList.add("sd-slide");
  if (slide.classes !== "") art.classList.add(slide.classes.split(" "));
  art.dataset.file = slide.file;
  art.dataset.num = slide.num;
  art.dataset.classes = slide.classes;
  art.innerHTML = slide.content;
  art.addEventListener("click", (event) => {
    event.stopImmediatePropagation();
    event.preventDefault();
    $previews
      .querySelectorAll("article")
      .forEach((a) => a.classList.remove("studio-selected"));
    art.classList.add("studio-selected");
    $workbench.innerHTML = `
      <article
        class="sd-slide ${art.dataset.classes}"
        data-file="${art.dataset.file}"
        data-num="${art.dataset.num}"
        data-classes="${art.dataset.classes}"
        style="zoom: ${zoom - 3}%">
        ${art.innerHTML}
      </article>
    `;
    $saveSlide.setAttribute("disabled", "true");
    $workbench.querySelectorAll("h2, p").forEach((el) => {
      el.setAttribute("contenteditable", "true");
      el.addEventListener("input", (event) => {
        $saveSlide.removeAttribute("disabled");
      });
    });
  });
  $previews.append(art);
};

const fetchSlides = async () => {
  $previews.innerHTML = "";
  const slides = await (await fetch("/api/slides")).json();
  let lastNum = 0;
  let file = "";
  slides.slides.forEach((slide) => {
    if (file === "") file = slide.file;
    if (slide.file === file) lastNum = slide.num;
    makeSlidePreview(slide);
  });
  makeSlidePreview({
    file,
    content: `<div class="studio-add-slide">+</div>`,
    num: lastNum + 1,
    classes: "",
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  await addPresentationStyles();
  await fetchSlides();
  zoom = (100 * $workbench.clientWidth) / 1920;
});
