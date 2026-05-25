import { saveCurrentSlide } from "./slides.js";

const $workbench = document.getElementById("workbench");
const EDITABLE_SELECTORS = "h2, p, figure, pre";

let selectedEl = null;

const $elSection = document.getElementById("css-element");
const $color = document.getElementById("css-color");
const $size = document.getElementById("css-size");
const $weight = document.getElementById("css-weight");
const $style = document.getElementById("css-style");
const $align = document.getElementById("css-align");
const $elBg = document.getElementById("css-el-bg");
const $elBgClear = document.getElementById("css-el-bg-clear");
const $slideBg = document.getElementById("css-slide-bg");
const $slideImg = document.getElementById("css-slide-img");

const setStyle = (el, prop, value) => {
  if (!el) return;
  if (value === "" || value === null) el.style[prop] = "";
  else el.style[prop] = value;
};

const rgb2hex = (rgb) => {
  const m = rgb?.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return "";
  return `#${[m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
};

const hasInlineBg = (el) => el.style.backgroundColor !== "";

const refreshElementPanel = (el) => {
  if (!el) { $elSection.classList.add("hidden"); return; }
  $elSection.classList.remove("hidden");
  const cs = getComputedStyle(el);
  $color.value = rgb2hex(cs.color) || "#000000";
  $size.value = cs.fontSize !== "0px" ? cs.fontSize : "";
  $weight.value = cs.fontWeight;
  $style.value = cs.fontStyle;
  $align.value = cs.textAlign;
  const explicit = hasInlineBg(el);
  $elBgClear.disabled = !explicit;
  if (explicit) $elBg.value = rgb2hex(cs.backgroundColor) || "#000000";
};

const refreshSlidePanel = () => {
  const slide = $workbench.querySelector("article.sd-slide");
  if (!slide) return;
  const cs = getComputedStyle(slide);
  $slideBg.value = rgb2hex(cs.backgroundColor) || "#ffffff";
};

const applyElementChange = () => {
  if (!selectedEl) return;
  setStyle(selectedEl, "color", $color.value);
  setStyle(selectedEl, "fontSize", $size.value);
  setStyle(selectedEl, "fontWeight", $weight.value);
  setStyle(selectedEl, "fontStyle", $style.value);
  setStyle(selectedEl, "textAlign", $align.value);
  if (hasInlineBg(selectedEl)) setStyle(selectedEl, "backgroundColor", $elBg.value);
  saveCurrentSlide();
};

const applySlideChange = () => {
  const slide = $workbench.querySelector("article.sd-slide");
  if (!slide) return;
  setStyle(slide, "backgroundColor", $slideBg.value);
  saveCurrentSlide();
};

$color.addEventListener("input", applyElementChange);
$size.addEventListener("change", applyElementChange);
$weight.addEventListener("change", applyElementChange);
$style.addEventListener("change", applyElementChange);
$align.addEventListener("change", applyElementChange);
$elBg.addEventListener("input", () => {
  selectedEl.style.backgroundColor = $elBg.value;
  $elBgClear.disabled = false;
  saveCurrentSlide();
});
$slideBg.addEventListener("input", applySlideChange);

$elBgClear.addEventListener("click", () => {
  if (!selectedEl) return;
  selectedEl.style.backgroundColor = "";
  saveCurrentSlide();
  selectElement(selectedEl);
});

$slideImg.addEventListener("change", async () => {
  const file = $slideImg.files?.[0];
  if (!file) return;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/image/upload", { method: "POST", body: form });
  if (!res.ok) return;
  const url = await res.text();
  const slide = $workbench.querySelector("article.sd-slide");
  if (slide) { slide.style.backgroundImage = `url(${url})`; }
  $slideImg.value = "";
  await saveCurrentSlide();
});

export const selectElement = (el) => {
  selectedEl = el;
  refreshElementPanel(el);
};

export const selectSlide = () => {
  selectedEl = null;
  refreshElementPanel(null);
  refreshSlidePanel();
};

$workbench.addEventListener("focusin", (e) => {
  const el = e.target.closest(EDITABLE_SELECTORS);
  if (el) selectElement(el);
});

$workbench.addEventListener("click", (e) => {
  if (!e.target.closest(EDITABLE_SELECTORS)) selectSlide();
});
