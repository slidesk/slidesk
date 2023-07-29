window.slidesk.sendMessage = (payload) => {
  window.slidesk.waitForSocketConnection(payload);
};

window.slidesk.waitForSocketConnection = (payload) => {
  setTimeout(() => {
    if (window.slidesk.io?.readyState === 1) window.slidesk.io.send(payload);
    else window.slidesk.waitForSocketConnection(payload);
  }, 5);
};

if (window.slidesk.io) {
  window.slidesk.io.onmessage = (event) => {
    const action = JSON.parse(event.data).action;
    if (action === "reload") location.reload();
    else if (action === "next") window.slidesk.next();
    else if (action === "previous") window.slidesk.previous();
  };
}

window.slidesk.cleanOldSlide = (id) => {
  window.slidesk.slides[id].classList.remove("👆", "no-🏄");
  setTimeout(() => {
    window.slidesk.slides[id].querySelectorAll("img").forEach((img) => {
      img.setAttribute("data-src", img.getAttribute("src"));
      img.removeAttribute("src");
    });
  }, window.slidesk.animationTimer);
};

window.slidesk.changeSlide = () => {
  window.slidesk.slides[window.slidesk.currentSlide].classList.remove("👈");
  window.slidesk.slides[window.slidesk.currentSlide].classList.add("👆");
  window.location.hash =
    "/" +
    window.slidesk.slides[window.slidesk.currentSlide].getAttribute(
      "data-slug",
    );
  if (window.slidesk.io) {
    window.slidesk.sendMessage(
      JSON.stringify({
        action: "current",
        payload: window.slidesk.slides[window.slidesk.currentSlide].outerHTML,
      }),
    );
    window.slidesk.sendMessage(
      JSON.stringify({
        action: "future",
        payload:
          window.slidesk.currentSlide !== window.slidesk.slides.length - 1
            ? window.slidesk.slides[window.slidesk.currentSlide + 1].outerHTML
            : "",
      }),
    );
  }
  window.slidesk.slides[window.slidesk.currentSlide]
    .querySelectorAll("img")
    .forEach((img) => {
      img.setAttribute("src", img.getAttribute("data-src"));
      img.removeAttribute("data-src");
    });
  const $progress = document.querySelector("#sd-progress");
  $progress.innerText =
    window.slidesk.currentSlide + 1 + "/" + window.slidesk.slides.length;
  $progress.style.width =
    (100 * (window.slidesk.currentSlide + 1)) / window.slidesk.slides.length +
    "%";
};

window.slidesk.next = () => {
  if (window.slidesk.currentSlide != window.slidesk.slides.length - 1) {
    window.slidesk.cleanOldSlide(window.slidesk.currentSlide);
    window.slidesk.slides[window.slidesk.currentSlide].classList.add("👈");
    window.slidesk.currentSlide++;
    window.slidesk.changeSlide();
  }
};

window.slidesk.previous = () => {
  if (window.slidesk.currentSlide != 0) {
    window.slidesk.cleanOldSlide(window.slidesk.currentSlide);
    window.slidesk.currentSlide--;
    window.slidesk.changeSlide();
  }
};

window.onload = () => {
  if (window.slidesk.io) {
    const customcss = document.querySelector("#sd-customcss");
    if (customcss)
      window.slidesk.sendMessage(
        JSON.stringify({
          action: "customcss",
          payload: customcss.getAttribute("href"),
        }),
      );
    const customsvjs = document
      .querySelector("#sd-scripts")
      .getAttribute("data-sv");
    if (customsvjs)
      window.slidesk.sendMessage(
        JSON.stringify({
          action: "customsvjs",
          payload: customsvjs,
        }),
      );
  }
  window.slidesk.slides = document.querySelectorAll(".🎞️");
  const loadingHash = window.location.hash.replace("#/", "");
  const slugs = [];
  window.slidesk.slides.forEach((slide, i) => {
    const h = slide.querySelector("h2");
    slugs.push(h ? h.getAttribute("data-slug") : "" + (i ? i : ""));
  });
  window.slidesk.currentSlide = slugs.indexOf(loadingHash);
  if (window.slidesk.currentSlide < 0) window.slidesk.currentSlide = 0;
  if (window.slidesk.currentSlide) {
    for (let i = 0; i < window.slidesk.currentSlide; i++) {
      window.slidesk.slides[i].classList.add("👈", "no-🏄");
    }
    setTimeout(() => {
      for (let i = 0; i < window.slidesk.currentSlide; i++) {
        window.slidesk.slides[i].classList.remove("no-🏄");
      }
    }, window.slidesk.animationTimer);
  }
  window.slidesk.slides[window.slidesk.currentSlide].classList.add(
    "👆",
    "no-🏄",
  );
  window.slidesk.changeSlide();
  document.addEventListener("keydown", (e) => {
    if (e.key == "ArrowLeft") {
      window.slidesk.previous();
    } else if (e.key == "ArrowRight" || e.key == " ") {
      window.slidesk.next();
    }
  });
};
