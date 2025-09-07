const toHHMMSS = (secs) => {
  const secnum = Number.parseInt(Math.abs(secs), 10);
  return [Math.floor(secnum / 3600), Math.floor(secnum / 60) % 60, secnum % 60]
    .map((v) => v.toString().padStart(2, "0"))
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
};

const fromHHMMSS = (time) => {
  const hhmmss = time.split(":");
  if (hhmmss.length === 3) {
    return (
      3600 * Number.parseInt(hhmmss[0], 10) +
      60 * Number.parseInt(hhmmss[1], 10) +
      Number.parseInt(hhmmss[2], 10)
    );
  }
  return 60 * Number.parseInt(hhmmss[0], 10) + Number.parseInt(hhmmss[1], 10);
};

const timerCheckpoints = [];
let timerSlide = "";
let startTime = null;
let startSlideTime = null;
let currentNum = null;
window.slidesk.io.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.action === "current") {
    timerSlide = "";
    startSlideTime = null;
    const current = document.querySelector("#sd-sv-current");
    current.innerHTML = data.payload.replaceAll("img data-src=", "img src=");
    document.querySelector("#sd-sv-notes").innerHTML = [
      ...current.querySelectorAll("aside.sd-notes"),
    ]
      .map((a) => a.innerHTML)
      .join("");
    currentNum = current.querySelector(".sd-slide").getAttribute("data-num");
    // check timers
    const slidetime = current
      .querySelector(".sd-slide")
      .getAttribute("data-timer-slide");
    if (slidetime) {
      timerSlide = fromHHMMSS(slidetime);
      startSlideTime = Date.now();
    }
    window.slidesk.onSpeakerViewSlideChange();
  } else if (data.action === "future") {
    document.querySelector("#sd-sv-future").innerHTML = data.payload.replaceAll(
      "img data-src=",
      "img src=",
    );
  } else if (data.action === "checkpoints") {
    let lastCheckpoint = null;
    for (let i = Number(data.payload.nbSlides); i >= 0; i -= 1) {
      if (data.payload.timerCheckpoints[i]) {
        lastCheckpoint = fromHHMMSS(data.payload.timerCheckpoints[i]);
      }
      timerCheckpoints[i] = lastCheckpoint;
    }
  } else if (window.slidesk[data.action]) window.slidesk[data.action](data);
};
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    window.slidesk.io.send(JSON.stringify({ action: "previous" }));
  } else if (e.key === "ArrowRight") {
    window.slidesk.io.send(JSON.stringify({ action: "next" }));
  }
});

const svgOpen =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" /></svg>';

const viewOpen = (screen) => {
  window.open(
    `//${window.location.host}`,
    "_blank",
    `left=${screen.availLeft},
      top=${screen.availTop},
      width=${screen.availWidth},
      height=${screen.availHeight},
      fullscreen=yes,
      location=no,
      menubar=no,
      status=no,
      scrollsbar=no,
      titlebar=no,
      toolbar=no,
      popup`,
  );
};

window.slidesk.createButtons = async () => {
  const $screenWrapper = document.getElementById("sd-open-presentation");
  $screenWrapper.innerHTML = "";
  const { screens } = await window.getScreenDetails();
  [...screens].forEach((screen, _) => {
    const button = document.createElement("button");
    button.innerHTML = `${svgOpen}<span>Open presentation on <b>${screen.label}</b></span>`;
    button.addEventListener("click", () => viewOpen(screen));
    $screenWrapper.appendChild(button);
  });
};

window.slidesk.notes_up = () => {
  window.slidesk.scrollPosition -= 100;
  if (window.slidesk.scrollPosition < 0) window.slidesk.scrollPosition = 0;
  document
    .getElementById("sd-sv-notes")
    .scroll({ top: window.slidesk.scrollPosition });
};

window.slidesk.notes_down = () => {
  window.slidesk.scrollPosition += 100;
  document
    .getElementById("sd-sv-notes")
    .scroll({ top: window.slidesk.scrollPosition });
};

window.slidesk.start_timer = () => {
  startTime = Date.now();
};

setInterval(() => {
  if (startTime) {
    const time = (Date.now() - startTime) / 1000;
    window.slidesk.timer.innerText = toHHMMSS(time);
    window.slidesk.timer.classList.remove("emergency");
    if (timerCheckpoints[currentNum]) {
      if (timerCheckpoints[currentNum] < time) {
        window.slidesk.timer.classList.add("emergency");
      }
    }
  }
  if (startSlideTime) {
    const subtime = (Date.now() - startSlideTime) / 1000;
    window.slidesk.subtimer.innerText = toHHMMSS(timerSlide - subtime + 1);
    window.slidesk.subtimer.style.display = "block";
    window.slidesk.subtimer.classList.remove("emergency");
    if (subtime >= timerSlide) {
      window.slidesk.subtimer.classList.add("emergency");
    }
  } else {
    window.slidesk.subtimer.style.display = "none";
  }
}, 1000);
window.slidesk.timer.addEventListener("click", () => {
  window.slidesk.start_timer();
});
