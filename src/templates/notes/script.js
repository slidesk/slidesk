// actions only reach the functions slidesk and its plugins define
window.slidesk.dispatch = (data) => {
  if (
    Object.hasOwn(window.slidesk, data.action) &&
    typeof window.slidesk[data.action] === "function"
  )
    window.slidesk[data.action](data);
};

/**
 * Opens the websocket; once it has been open, a lost connection (present
 * restarted) is retried, and the page reloads to get the new build. A page
 * that never connected (a static export) does not retry.
 */
window.slidesk.connect = (retry = 0) => {
  // the speaker's token, when present, lets this page drive the talk
  const token = new URLSearchParams(window.location.search).get("token");
  let io;
  try {
    io = new WebSocket(
      `ws${window.location.protocol.includes("https") ? "s" : ""}://${window.location.host}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1)}ws${token ? `?token=${encodeURIComponent(token)}` : ""}`,
    );
  } catch (_) {
    return;
  }
  let opened = false;
  io.onopen = () => {
    opened = true;
    if (retry) window.location.reload();
  };
  io.onclose = () => {
    if (opened || retry)
      setTimeout(
        () => window.slidesk.connect(retry + 1),
        Math.min(500 * 2 ** retry, 5000),
      );
  };
  io.onmessage = (event) => window.slidesk.onSocketMessage(event);
  window.slidesk.io = io;
};

if (window.location.origin !== "file://") window.slidesk.connect();

// a key pressed while the socket opens is sent once it is open
const send = (payload) => {
  const io = window.slidesk.io;
  if (io?.readyState === WebSocket.OPEN) io.send(JSON.stringify(payload));
  else if (io?.readyState === WebSocket.CONNECTING)
    setTimeout(() => send(payload), 5);
};

window.slidesk.channel = null;
window.slidesk.checkpoints = null;
window.slidesk.presentationPath = null;

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

window.slidesk.getPresentationPath = () => {
  const currentPath = window.location.pathname;
  if (currentPath.endsWith("notes.html")) {
    return currentPath.replace("notes.html", "index.html");
  }
  return `${currentPath.substring(0, currentPath.lastIndexOf("/") + 1)}index.html`;
};

// the current slide and its notes, its timer, and the notes back at the top
const showCurrent = (html) => {
  timerSlide = "";
  startSlideTime = null;
  const current = document.querySelector("#sd-sv-current");
  current.innerHTML = html.replaceAll("img data-src=", "img src=");
  const notes = document.querySelector("#sd-sv-notes");
  notes.innerHTML = [...current.querySelectorAll("aside.sd-notes")]
    .map((a) =>
      decodeURIComponent(
        atob(a.innerHTML).replaceAll(
          /[\x80-\uffff]/g,
          (m) => `%${m.codePointAt(0).toString(16).padStart(2, "0")}`,
        ),
      ),
    )
    .join("");
  notes.scrollTo(0, 0);
  const slide = current.querySelector(".sd-slide");
  currentNum = slide?.getAttribute("data-num");
  const slidetime = slide?.getAttribute("data-timer-slide");
  if (slidetime) {
    timerSlide = fromHHMMSS(slidetime);
    startSlideTime = Date.now();
  }
};

const showFuture = (html) => {
  document.querySelector("#sd-sv-future").innerHTML = html.replaceAll(
    "img data-src=",
    "img src=",
  );
};

// a slide without a checkpoint keeps the one of the next slides
const setCheckpoints = (data) => {
  let lastCheckpoint = null;
  for (let i = Number(data.nbSlides); i >= 0; i -= 1) {
    if (data.timerCheckpoints[i]) {
      lastCheckpoint = fromHHMMSS(data.timerCheckpoints[i]);
    }
    timerCheckpoints[i] = lastCheckpoint;
  }
  window.slidesk.checkpoints = timerCheckpoints;
};

window.slidesk.setupChannel = () => {
  window.slidesk.channel = new BroadcastChannel("slidesk_sync");
  window.slidesk.channel.onmessage = (event) => {
    const data = event.data;
    if (data.action === "current") {
      showCurrent(data.payload);
      window.slidesk.onSpeakerViewSlideChange();
    } else if (data.action === "future") showFuture(data.payload);
    else if (data.action === "goto") {
      const slideNum = data.payload;
      if (slideNum !== undefined && window.slidesk.checkpoints) {
        currentNum = slideNum;
      }
    }
  };
};
// a value left by another version must not stop the speaker view
const loadSaved = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (_) {
    return null;
  }
};

window.slidesk.loadInitialState = () => {
  const savedSlide = loadSaved("slidesk_current_slide");
  if (savedSlide?.currentSlideHTML) {
    showCurrent(savedSlide.currentSlideHTML);
    showFuture(savedSlide.futureSlideHTML ?? "");
  }
  const savedCheckpoints = loadSaved("slidesk_checkpoints");
  if (savedCheckpoints?.timerCheckpoints) setCheckpoints(savedCheckpoints);
};
window.slidesk.onSocketMessage = (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch (_) {
    return;
  }
  if (data.action === "current") {
    showCurrent(data.payload);
    window.slidesk.onSpeakerViewSlideChange();
  } else if (data.action === "future") showFuture(data.payload);
  else if (data.action === "checkpoints") setCheckpoints(data.payload);
  else window.slidesk.dispatch(data);
};

// shortcuts of the browser (Cmd/Ctrl/Alt) and typing in a field are left alone
window.slidesk.ignoreKey = (e) =>
  e.metaKey ||
  e.ctrlKey ||
  e.altKey ||
  e.target.isContentEditable ||
  !!e.target.closest?.("input, textarea, select, .xterm");

// key -> action; the keyboard plugin removes the keys it maps itself
window.slidesk.keys = {
  ArrowLeft: "previous",
  ArrowRight: "next",
  PageUp: "previous",
  PageDown: "next",
  " ": "next",
  Home: "first",
  End: "last",
  b: "black",
  ".": "black",
  ArrowUp: "notes_up",
  ArrowDown: "notes_down",
};

document.addEventListener("keydown", (e) => {
  if (window.slidesk.ignoreKey(e)) return;
  const action = window.slidesk.keys[e.key];
  if (!action) return;
  e.preventDefault();
  // the speaker view scrolls its notes, the rest drives the presentation
  if (Object.hasOwn(window.slidesk, action)) window.slidesk[action]();
  // a held key scrolls the notes, it does not skip slides
  else if (!e.repeat) {
    send({ action });
    if (window.slidesk.channel) window.slidesk.channel.postMessage({ action });
  }
});

const svgOpen =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" /></svg>';

const viewOpen = (screen) => {
  window.open(
    `//${window.slidesk.getPresentationPath()}`,
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
  document.getElementById("sd-sv-notes").scrollBy({ top: -100 });
};

window.slidesk.notes_down = () => {
  document.getElementById("sd-sv-notes").scrollBy({ top: 100 });
};

window.slidesk.start_timer = () => {
  startTime = Date.now();
};

setInterval(() => {
  if (startTime) {
    const time = (Date.now() - startTime) / 1000;
    window.slidesk.timer.textContent = toHHMMSS(time);
    window.slidesk.timer.classList.remove("emergency");
    if (timerCheckpoints[currentNum]) {
      if (timerCheckpoints[currentNum] < time) {
        window.slidesk.timer.classList.add("emergency");
      }
    }
  }
  if (startSlideTime) {
    const subtime = (Date.now() - startSlideTime) / 1000;
    window.slidesk.subtimer.textContent = toHHMMSS(timerSlide - subtime + 1);
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

if (!window.getScreenDetails) {
  const $screenWrapper = document.getElementById("sd-open-presentation");
  $screenWrapper.innerHTML = "";
}

if (!window.slidesk.io) window.slidesk.setupChannel();
window.slidesk.loadInitialState();

// Listen for localStorage changes from the presentation
window.addEventListener("storage", (event) => {
  if (
    event.key === "slidesk_current_slide" ||
    event.key === "slidesk_checkpoints"
  )
    window.slidesk.loadInitialState();
});
