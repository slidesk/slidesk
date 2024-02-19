document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll("body > section *");
  elements.forEach((e) => {
    e.setAttribute(
      "data-animhash",
      (
        [...e.outerHTML].reduce(
          (s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0,
          0,
        ) +
        2147483647 +
        1
      ).toString(16),
    );
  });
});

const animation = ({ duration, timing, draw, done }) => {
  const start = performance.now();
  requestAnimationFrame(function animate(time) {
    let timeFraction = (time - start) / duration;
    if (timeFraction > 1) timeFraction = 1;
    const progress = timing(timeFraction);
    draw(progress);
    if (timeFraction < 1) {
      requestAnimationFrame(animate);
    } else {
      done();
    }
  });
};

window.slidesk.animateElements = () => {
  if (window.slidesk.currentSlide !== 0) {
    const prevHashes = [
      ...document.querySelectorAll("section.sd-previous [data-animhash]"),
    ].map((e) => e.getAttribute("data-animhash"));
    const currentHashes = [
      ...document.querySelectorAll("section.sd-current [data-animhash]"),
    ].map((e) => e.getAttribute("data-animhash"));
    currentHashes
      .filter((value) => prevHashes.includes(value))
      .forEach((intersection) => {
        const prevEl = document.querySelector(
          `section.sd-previous [data-animhash="${intersection}"]`,
        );
        const pBCR = prevEl.getBoundingClientRect();
        const pCS = window.getComputedStyle(prevEl);
        const currEl = document.querySelector(
          `section.sd-current [data-animhash="${intersection}"]`,
        );
        const cBCR = currEl.getBoundingClientRect();
        currEl.style.opacity = 0;
        const ghost = prevEl.cloneNode(true);
        [...pCS].forEach((key) => {
          ghost.style.setProperty(
            key,
            pCS.getPropertyValue(key),
            pCS.getPropertyPriority(key),
          );
        });
        ghost.style.position = "absolute";
        ghost.style.top = `${pBCR.top}px`;
        ghost.style.left = `${pBCR.left}px`;
        ghost.style.bottom = `${pBCR.bottom}px`;
        ghost.style.right = `${pBCR.right}px`;
        ghost.style.width = `${pBCR.width}px`;
        ghost.style.height = `${pBCR.height}px`;
        ghost.style.margin = "0";
        window.slidesk.slides[window.slidesk.currentSlide].appendChild(ghost);
        animation({
          duration: window.slidesk.animationTimer,
          timing: (timeFraction) => timeFraction,
          draw: (progress) => {
            ghost.style.top = `${pBCR.top + progress * (cBCR.top - pBCR.top)}px`;
            ghost.style.left = `${pBCR.left + progress * (cBCR.left - pBCR.left)}px`;
            ghost.style.bottom = `${pBCR.bottom + progress * (cBCR.bottom - pBCR.bottom)}px`;
            ghost.style.right = `${pBCR.right + progress * (cBCR.right - pBCR.right)}px`;
            ghost.style.width = `${pBCR.width + progress * (cBCR.width - pBCR.width)}px`;
            ghost.style.height = `${pBCR.height + progress * (cBCR.height - pBCR.height)}px`;
          },
          done: () => {
            currEl.style.opacity = 1;
            window.slidesk.slides[window.slidesk.currentSlide].removeChild(
              ghost,
            );
          },
        });
      });
  }
};
