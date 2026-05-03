let zoom = 0;
const EDITABLE_SELECTORS = "h2, p, figure, pre";
const $previews = document.getElementById("previews");
const $workbench = document.getElementById("workbench");
const $classes = document.getElementById("classes");

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

const saveCurrentSlide = async () => {
  const $slide = $workbench.querySelector("article.sd-slide");
  [...$slide.querySelectorAll(".studio-drag-handle")].forEach((e) => {
    e.remove();
  });
  const html = $slide.innerHTML.replace(/>\s+</g, "><").trim();
  let content = "";
  const classes = $classes.value;
  if (html.indexOf("position: absolute;") !== -1)
    content = `## .[${classes}]\n${html.replace('contenteditable="true" ', "")}`;
  else
    content = turndownService
      .turndown(html)
      .split("\n")
      .map((l, i) => {
        if (i === 0) return `${l} .[${classes}]`;
        return l;
      })
      .join("\n");
  await fetch("/api/slide/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: $slide.dataset.file,
      classes: $slide.dataset.classes,
      num: $slide.dataset.num,
      content,
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
      ?.click();
  }, 10);
};

const addPresentationStyles = async () => {
  const styles = await (await fetch("/api/styles")).json();
  styles.css?.forEach((s) => {
    document.head.innerHTML += s;
  });
};

const freezeSlideLayout = (slide) => {
  if (slide.dataset.frozen) return;
  slide.dataset.frozen = "true";

  const slideRect = slide.getBoundingClientRect();
  const scale = slide.offsetWidth / slideRect.width;

  slide.querySelectorAll(EDITABLE_SELECTORS).forEach((el) => {
    const rect = el.getBoundingClientRect();
    const x = (rect.left - slideRect.left) * scale;
    const y = (rect.top - slideRect.top) * scale;
    const w = rect.width * scale;
    const h = rect.height * scale;

    el.style.position = "relative";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.width = w + "px";
    el.style.height = h + "px";
  });

  slide.querySelectorAll(EDITABLE_SELECTORS).forEach((el) => {
    el.style.position = "absolute";
  });
};

const makeDraggable = (el, slide) => {
  const handle = document.createElement("span");
  handle.className = "studio-drag-handle";
  handle.textContent = "✥";
  handle.setAttribute("contenteditable", "false");
  el.appendChild(handle);

  let startMouseX, startMouseY, startElX, startElY, dragging;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    startMouseX = e.clientX;
    startMouseY = e.clientY;
    dragging = false;

    const slideRect = slide.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scale = slide.offsetWidth / slideRect.width;
    startElX = (elRect.left - slideRect.left) * scale;
    startElY = (elRect.top - slideRect.top) * scale;

    const onMouseMove = (e) => {
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;

      if (!dragging && Math.hypot(dx, dy) < 4) return;

      if (!dragging) {
        dragging = true;
        freezeSlideLayout(slide);
        el.blur();
        el.setAttribute("contenteditable", "false");
        handle.style.cursor = "grabbing";
      }

      const slideRect = slide.getBoundingClientRect();
      const scale = slide.offsetWidth / slideRect.width;

      let x = startElX + dx * scale;
      let y = startElY + dy * scale;

      x = Math.max(0, Math.min(x, slide.offsetWidth - el.offsetWidth));
      y = Math.max(0, Math.min(y, slide.offsetHeight - el.offsetHeight));

      el.style.left = x + "px";
      el.style.top = y + "px";
    };

    const onMouseUp = () => {
      if (dragging) {
        el.setAttribute("contenteditable", "true");
        handle.style.cursor = "grab";
        saveCurrentSlide();
      }
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
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
    $classes.value = art.dataset.classes;
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
    $classes.textContent = art.dataset.classes;
    const $slide = $workbench.querySelector("article.sd-slide");
    $workbench.querySelectorAll(EDITABLE_SELECTORS).forEach((el) => {
      el.setAttribute("contenteditable", "true");
      el.addEventListener("blur", async () => {
        await saveCurrentSlide();
      });
      makeDraggable(el, $slide);
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
