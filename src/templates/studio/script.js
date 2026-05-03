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
        .replaceAll(
          /[&<>"'` !@$%()=+{}[\]]/g,
          (match) => `&#${match.codePointAt(0)};`,
        )
        .split("\n")
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
  const $notesTextarea = document.getElementById("speaker-notes");
  const notesValue = $notesTextarea?.value || "";
  const $slide = $workbench.querySelector("article.sd-slide");
  [
    ...$slide.querySelectorAll(".studio-drag-handle, .studio-resize-handle"),
  ].forEach((e) => {
    e.remove();
  });
  const html = $slide.innerHTML.replace(/>\s+</g, "><").trim();
  const classes = $classes.value;
  const content =
    html.indexOf("position: absolute;") !== -1
      ? `## .[${classes}]\n${html.replace('contenteditable="true"', "")}\n/*\n${notesValue}\n*/`
      : turndownService
          .turndown(
            `${html}<aside class="sd-notes">${encodeComments(notesValue)}</aside>`,
          )
          .split("\n")
          .map((l, i) => (i === 0 ? `${l} .[${classes}]` : l))
          .join("\n");
  await fetch("/api/slide/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    el.style.position = "relative";
    el.style.left = (rect.left - slideRect.left) * scale + "px";
    el.style.top = (rect.top - slideRect.top) * scale + "px";
    el.style.width = rect.width * scale + "px";
    el.style.height = rect.height * scale + "px";
  });

  slide.querySelectorAll(EDITABLE_SELECTORS).forEach((el) => {
    el.style.position = "absolute";
  });
};

const startDrag = (
  e,
  el,
  slide,
  { immediate = false, onDragStart, onMove, onEnd } = {},
) => {
  e.preventDefault();
  e.stopPropagation();

  const startMouseX = e.clientX;
  const startMouseY = e.clientY;
  let dragging = false;

  const getScale = () => {
    const slideRect = slide.getBoundingClientRect();
    return slide.offsetWidth / slideRect.width;
  };

  const onMouseMove = (e) => {
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;

    if (!dragging) {
      if (!immediate && Math.hypot(dx, dy) < 4) return;
      dragging = true;
      freezeSlideLayout(slide);
      el.blur();
      el.setAttribute("contenteditable", "false");
      onDragStart?.();
    }

    onMove(dx, dy, getScale());
  };

  const onMouseUp = () => {
    if (dragging) {
      el.setAttribute("contenteditable", "true");
      onEnd?.();
      saveCurrentSlide();
    }
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const makeDraggable = (el, slide) => {
  const handle = document.createElement("span");
  handle.className = "studio-drag-handle";
  handle.textContent = "✥";
  handle.setAttribute("contenteditable", "false");
  el.appendChild(handle);

  handle.addEventListener("mousedown", (e) => {
    const slideRect = slide.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scale = slide.offsetWidth / slideRect.width;
    const startElX = (elRect.left - slideRect.left) * scale;
    const startElY = (elRect.top - slideRect.top) * scale;

    startDrag(e, el, slide, {
      onDragStart: () => {
        handle.style.cursor = "grabbing";
      },
      onMove: (dx, dy, scale) => {
        el.style.left =
          Math.max(
            0,
            Math.min(startElX + dx * scale, slide.offsetWidth - el.offsetWidth),
          ) + "px";
        el.style.top =
          Math.max(
            0,
            Math.min(
              startElY + dy * scale,
              slide.offsetHeight - el.offsetHeight,
            ),
          ) + "px";
      },
      onEnd: () => {
        handle.style.cursor = "grab";
      },
    });
  });
};

const makeResizable = (el, slide) => {
  const handle = document.createElement("span");
  handle.className = "studio-resize-handle studio-resize-se";
  handle.textContent = "⇲";
  handle.setAttribute("contenteditable", "false");
  el.appendChild(handle);

  handle.addEventListener("mousedown", (e) => {
    const startWidth = el.offsetWidth;
    const startHeight = el.offsetHeight;

    startDrag(e, el, slide, {
      immediate: true,
      onMove: (dx, dy, scale) => {
        el.style.width = Math.max(50, startWidth + dx * scale) + "px";
        el.style.height = Math.max(20, startHeight + dy * scale) + "px";
      },
    });
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
      <textarea id="speaker-notes" style="zoom: ${zoom - 3}%"></textarea>
    `;
    $classes.textContent = art.dataset.classes;
    const $slide = $workbench.querySelector("article.sd-slide");
    const $notesTextarea = document.getElementById("speaker-notes");
    $notesTextarea.value = [...art.querySelectorAll("aside.sd-notes")]
      .map((n) => decodeComments(n.textContent))
      .join("\n");
    $notesTextarea.addEventListener("blur", async () => {
      await saveCurrentSlide();
    });
    [...$workbench.querySelectorAll("aside.sd-notes")].forEach((n) => {
      n.remove();
    });
    $workbench.querySelectorAll(EDITABLE_SELECTORS).forEach((el) => {
      el.setAttribute("contenteditable", "true");
      el.addEventListener("blur", async () => {
        await saveCurrentSlide();
      });
      makeDraggable(el, $slide);
      makeResizable(el, $slide);
    });
    let notesVisible = false;
    document.getElementById("toggle-notes").addEventListener("click", () => {
      if (notesVisible) {
        $slide.style.display = "none";
        $notesTextarea.style.display = "block";
      } else {
        $slide.style.display = "flex";
        $notesTextarea.style.display = "none";
      }
      notesVisible = !notesVisible;
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
