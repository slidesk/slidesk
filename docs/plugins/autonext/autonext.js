window.slidesk.autonext = () => {
  const classes = [
    ...window.slidesk.slides[window.slidesk.currentSlide].classList,
  ].filter((c) => c.startsWith("auto-"));
  if (classes.length) {
    const timer =
      Number(classes[0].replace("auto-", "")) +
      Number(window.slidesk.animationTimer);
    window.slidesk.autonextTimer = setTimeout(
      () => window.slidesk.next(),
      timer,
    );
  } else {
    clearTimeout(window.slidesk.autonextTimer);
  }
};

window.slidesk.autonextNotes = () => {
  const classes = [
    ...window.slidesk.slides[window.slidesk.currentSlide].classList,
  ].filter((c) => c.startsWith("auto-"));
  const current = document.querySelector("#sd-sv-current");
  if (classes.length) {
    current.classList.add("autonexted");
  } else {
    current.classList.remove("autonexted");
  }
};
