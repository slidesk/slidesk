let zoom = 0;
const $previews = document.getElementById("previews");
const $workbench = document.getElementById("workbench");
const $saveSlide = document.getElementById("saveSlide");

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
