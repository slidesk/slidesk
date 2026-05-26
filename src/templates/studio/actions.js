import { EDITABLE_SELECTORS } from "./script.js";
import { saveCurrentSlide } from "./slides.js";

const freezeSlideLayout = (slide) => {
  if (slide.dataset.frozen) return;
  slide.dataset.frozen = "true";
  const slideRect = slide.getBoundingClientRect();
  const scale = slide.offsetWidth / slideRect.width;
  slide.querySelectorAll(EDITABLE_SELECTORS).forEach((el) => {
    const rect = el.getBoundingClientRect();
    el.style.position = "relative";
    el.style.left = `${(rect.left - slideRect.left) * scale}px`;
    el.style.top = `${(rect.top - slideRect.top) * scale}px`;
    el.style.width = `${rect.width * scale}px`;
    el.style.height = `${rect.height * scale}px`;
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
  const getScale = () => slide.offsetWidth / slide.getBoundingClientRect().width;
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

const addHandle = (el, className, text, title) => {
  const handle = document.createElement("span");
  handle.className = className;
  handle.textContent = text;
  handle.title = title;
  handle.setAttribute("contenteditable", "false");
  el.appendChild(handle);
  return handle;
};

export const makeDraggable = (el, slide) => {
  const handle = addHandle(el, "studio-drag-handle", "🏄", "Drag");
  handle.addEventListener("mousedown", (e) => {
    const slideRect = slide.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scale = slide.offsetWidth / slideRect.width;
    const startElX = (elRect.left - slideRect.left) * scale;
    const startElY = (elRect.top - slideRect.top) * scale;
    startDrag(e, el, slide, {
      onDragStart: () => { handle.style.cursor = "grabbing"; },
      onMove: (dx, dy, scale) => {
        el.style.left = `${Math.max(0, Math.min(startElX + dx * scale, slide.offsetWidth - el.offsetWidth))}px`;
        el.style.top = `${Math.max(0, Math.min(startElY + dy * scale, slide.offsetHeight - el.offsetHeight))}px`;
      },
      onEnd: () => { handle.style.cursor = "grab"; },
    });
  });
};

export const makeResizable = (el, slide) => {
  const handle = addHandle(el, "studio-resize-handle", "📏", "Resize");
  handle.addEventListener("mousedown", (e) => {
    const startWidth = el.offsetWidth;
    const startHeight = el.offsetHeight;
    startDrag(e, el, slide, {
      immediate: true,
      onMove: (dx, dy, scale) => {
        el.style.width = `${Math.max(50, startWidth + dx * scale)}px`;
        el.style.height = `${Math.max(20, startHeight + dy * scale)}px`;
      },
    });
  });
};

export const makeRemovable = (el) => {
  const handle = addHandle(el, "studio-remove-handle", "🗑️", "Remove");
  handle.addEventListener("click", () => {
    if (confirm("Remove this item?")) {
      el.remove();
      saveCurrentSlide();
    }
  });
};
