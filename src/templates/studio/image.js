import { $workbench } from "./script.js";
import { saveCurrentSlide } from "./slides.js";

export const addImageItem = () => {
  const $modal = document.getElementById("image-modal");
  const $file = $modal.querySelector("#img-src");
  const $alt = $modal.querySelector("#img-alt");
  const $width = $modal.querySelector("#img-width");
  const $height = $modal.querySelector("#img-height");
  const $caption = $modal.querySelector("#img-caption");
  const $hideCaption = $modal.querySelector("#img-hide-caption");
  const $cancel = $modal.querySelector("#img-cancel");
  const $insert = $modal.querySelector("#img-insert");

  $file.value = "";
  $alt.value = "";
  $width.value = "";
  $height.value = "";
  $caption.value = "";
  $hideCaption.checked = false;
  $insert.disabled = false;

  const close = () => { $modal.classList.add("hidden"); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  $cancel.onclick = close;
  $modal.onclick = (e) => { if (e.target === $modal) close(); };
  document.addEventListener("keydown", onKey);

  $insert.onclick = async () => {
    const file = $file.files?.[0];
    if (!file) return;
    $insert.disabled = true;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/image/upload", { method: "POST", body: form });
    if (!res.ok) { $insert.disabled = false; return; }
    const src = await res.text();
    const figure = document.createElement("figure");
    figure.className = "sd-img";
    const captionText = $caption.value.trim();
    const hide = $hideCaption.checked;
    figure.innerHTML = `
      <img src="${src}" alt="${$alt.value.trim()}"${$width.value ? ` width="${$width.value.trim()}"` : ""}${$height.value ? ` height="${$height.value.trim()}"` : ""} />
      <figcaption${hide ? ' style="display: none"' : ""}>${captionText}</figcaption>
    `;
    $workbench.querySelector("article.sd-slide").appendChild(figure);
    await saveCurrentSlide();
    close();
  };

  $modal.classList.remove("hidden");
};
