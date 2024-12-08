// document.getElementById(\"sd-progress\").style.width = (100 * (window.slidesk.currentSlide + 1)) / window.slidesk.slides.length + \"%\";
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const $progress = document.querySelector("#sd-progress");
    const nb = window.slidesk.slides.length;
    [...window.slidesk.slides].forEach((s, i) => {
      const slug = s.getAttribute("data-slug");
      $progress.innerHTML += `<a href="javascript:window.slidesk.goto(${i});" title="${
        i + 1
      }. ${slug}" class="sd-progression" style="width: calc(${
        100 / nb
      }% - 2px);"></a>`;
    });
    window.slidesk.progressActive();
  }, 100);
});

window.slidesk.progressActive = () => {
  document.querySelectorAll("#sd-progress .sd-progression").forEach((s, i) => {
    s.classList.remove("active");
    if (i <= window.slidesk.currentSlide) s.classList.add("active");
  });
};
