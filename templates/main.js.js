export const js = `
window.talkflow.io.onmessage = (event) => {
  const action = JSON.parse(event.data).action;
  if (action === "reload") location.reload();
  else if (action === "next") window.talkflow.next();
  else if (action === "previous") window.talkflow.previous();
};

window.talkflow.cleanOldSlide = (id) => {
  window.talkflow.slides[id].classList.remove("👆", "no-🏄");
  setTimeout(() => {
    window.talkflow.slides[id].querySelectorAll("img").forEach((img) => {
      img.setAttribute("data-src", img.getAttribute("src"));
      img.removeAttribute("src");
    });
  }, window.talkflow.animationTimer);
};

window.talkflow.changeSlide = () => {
  window.talkflow.slides[window.talkflow.currentSlide].classList.remove("👈");
  window.talkflow.slides[window.talkflow.currentSlide].classList.add("👆");
  const h =
    window.talkflow.slides[window.talkflow.currentSlide].querySelector("h2");
  window.location.hash =
    "/" +
    (h
      ? h.getAttribute("data-slug")
      : "" +
        (window.talkflow.currentSlide ? window.talkflow.currentSlide : ""));
  window.talkflow.io.send(
    JSON.stringify({
      action: "current",
      payload: window.talkflow.slides[window.talkflow.currentSlide].outerHTML,
    })
  );
  window.talkflow.io.send(
    JSON.stringify({
      action: "future",
      payload:
        window.talkflow.currentSlide !== window.talkflow.slides.length -1
          ? window.talkflow.slides[window.talkflow.currentSlide + 1].outerHTML
          : "",
    })
  );
  window.talkflow.slides[window.talkflow.currentSlide]
    .querySelectorAll("img")
    .forEach((img) => {
      img.setAttribute("src", img.getAttribute("data-src"));
      img.removeAttribute("data-src");
    });
  const $progress = document.querySelector('#tf-progress');
  $progress.innerText = (window.talkflow.currentSlide + 1) + "/" + window.talkflow.slides.length;
  $progress.style.width = (100 * (window.talkflow.currentSlide + 1) / window.talkflow.slides.length) + "%";
};

window.talkflow.next = () => {
  if (window.talkflow.currentSlide != window.talkflow.slides.length - 1) {
    window.talkflow.cleanOldSlide(window.talkflow.currentSlide);
    window.talkflow.slides[window.talkflow.currentSlide].classList.add(
      "👈"
    );
    window.talkflow.currentSlide++;
    window.talkflow.changeSlide();
  }
};

window.talkflow.previous = () => {
  if (window.talkflow.currentSlide != 0) {
    window.talkflow.cleanOldSlide(window.talkflow.currentSlide);
    window.talkflow.currentSlide--;
    window.talkflow.changeSlide();
  }
};

window.onload = () => {
  const customcss = document.querySelector('#tf-customcss');
  if (customcss)
    window.talkflow.io.send(
      JSON.stringify({
        action: "customcss",
        payload: customcss.getAttribute('href'),
      })
    );
  const customsvjs = document.querySelector('#tf-scripts').getAttribute('data-sv');
  if (customsvjs)
      window.talkflow.io.send(
        JSON.stringify({
          action: "customsvjs",
          payload: customsvjs
        })
      );
  window.talkflow.slides = document.querySelectorAll(".🎞️");
  const loadingHash = window.location.hash.replace("#/", "");
  const slugs = [];
  window.talkflow.slides.forEach((slide, i) => {
    const h = slide.querySelector("h2");
    slugs.push(h ? h.getAttribute("data-slug") : "" + (i ? i : ""));
  });
  window.talkflow.currentSlide = slugs.indexOf(loadingHash);
  if (window.talkflow.currentSlide < 0) window.talkflow.currentSlide = 0;
  if (window.talkflow.currentSlide) {
    for (let i = 0; i < window.talkflow.currentSlide; i++) {
      window.talkflow.slides[i].classList.add("👈", "no-🏄");
    }
    setTimeout(() => {
      for (let i = 0; i < window.talkflow.currentSlide; i++) {
        window.talkflow.slides[i].classList.remove("no-🏄");
      }
    }, window.talkflow.animationTimer);
  }
  window.talkflow.slides[window.talkflow.currentSlide].classList.add(
    "👆",
    "no-🏄"
  );
  window.talkflow.changeSlide();
  document.addEventListener("keydown", (e) => {
    if (e.key == "ArrowLeft") {
      window.talkflow.previous();
    } else if (e.key == "ArrowRight" || e.key == " ") {
      window.talkflow.next();
    }
  });
};  
`;
