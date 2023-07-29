const makeSlide = (slide) => slide.replace("data-src", "src");
window.slidesk.io.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.action === "current") {
    const current = document.querySelector("#sd-sv-current");
    current.innerHTML = makeSlide(data.payload);
    document.querySelector("#sd-sv-notes").innerHTML = [
      ...current.querySelectorAll("aside.📝"),
    ]
      .map((a) => a.innerHTML)
      .join("");
  }
  if (data.action === "future") {
    document.querySelector("#sd-sv-future").innerHTML = makeSlide(data.payload);
  }
  if (data.action === "customcss") {
    document.querySelector("head").innerHTML +=
      '<link rel="stylesheet" href="' + data.payload + '">';
  }
  if (data.action === "customsvjs") {
    const s = document.createElement("script");
    s.src = data.payload;
    document.querySelector("body").append(s);
  }
};
document.addEventListener("keydown", (e) => {
  if (e.key == "ArrowLeft") {
    window.slidesk.io.send(JSON.stringify({ action: "previous" }));
  } else if (e.key == "ArrowRight" || e.key == " ") {
    window.slidesk.io.send(JSON.stringify({ action: "next" }));
  }
});
let startTime = null;
const toHHMMSS = (secs) => {
  var sec_num = parseInt(secs, 10);
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor(sec_num / 60) % 60;
  var seconds = sec_num % 60;

  return [hours, minutes, seconds]
    .map((v) => (v < 10 ? "0" + v : v))
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
};
setInterval(() => {
  if (startTime)
    window.slidesk.timer.innerText = toHHMMSS((Date.now() - startTime) / 1000);
}, 1000);
window.slidesk.timer.addEventListener("click", () => {
  startTime = Date.now();
});
