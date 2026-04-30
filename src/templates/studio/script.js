const $previews = document.getElementById("previews");
const $workbench = document.getElementById("workbench");

const addPresentationStyles = async () => {
  const styles = await (await fetch("/api/styles")).json();
  styles.css?.forEach((s) => {
    document.head.innerHTML += s;
  });
};

const fetchSlides = async () => {
  const slides = await (await fetch("/api/slides")).json();
  slides.slides.forEach((slide) => {
    const art = document.createElement("article");
    art.dataset.file = slide.file;
    art.textContent = slide.content;
    $previews.append(art);
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  await addPresentationStyles();
  await fetchSlides();
});
