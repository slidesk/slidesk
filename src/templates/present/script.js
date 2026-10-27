window.slidesk.channel = null;

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

window.slidesk.setupChannel = () => {
  if (!window.slidesk.channel) {
    window.slidesk.channel = new BroadcastChannel("slidesk_sync");
    window.slidesk.channel.onmessage = (event) => {
      const data = event.data;
      if (
        data.action === "goto" &&
        window.location.hostname !== window.slidesk.domain &&
        window.location.hostname !== "localhost"
      ) {
        window.slidesk.goto(data.payload);
      } else window.slidesk.dispatch(data);
    };
  }
};

window.slidesk.sendMessage = (payload) => {
  if (window.slidesk.channel) window.slidesk.channel.postMessage(payload);
  else window.slidesk.waitForSocketConnection(payload);
};

window.slidesk.waitForSocketConnection = (payload) => {
  setTimeout(() => {
    const io = window.slidesk.io;
    if (io?.readyState === WebSocket.OPEN) io.send(JSON.stringify(payload));
    // only a connecting socket is waited for: a closed one never opens again
    else if (io?.readyState === WebSocket.CONNECTING)
      window.slidesk.waitForSocketConnection(payload);
  }, 5);
};

window.slidesk.onSocketMessage = (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch (_) {
    return;
  }
  if (data.action === "reload") window.location.reload();
  else if (
    data.action === "goto" &&
    window.location.hostname !== window.slidesk.domain &&
    window.location.hostname !== "localhost"
  )
    window.slidesk.goto(data.payload);
  else window.slidesk.dispatch(data);
};

window.slidesk.cleanOldSlide = (id) => {
  window.slidesk.slides[id].classList.remove("sd-current", "no-sd-animation");
};

window.slidesk.changeSlide = () => {
  window.slidesk.saveCheckpoints();
  window.slidesk.slides[window.slidesk.currentSlide].classList.remove(
    "sd-previous",
  );
  window.slidesk.slides[window.slidesk.currentSlide].classList.add(
    "sd-current",
  );
  window.location.hash = window.slidesk.currentSlide;

  const slideData = {
    currentSlideHTML:
      window.slidesk.slides[window.slidesk.currentSlide].outerHTML,
    futureSlideHTML:
      window.slidesk.currentSlide !== window.slidesk.slides.length - 1
        ? window.slidesk.slides[window.slidesk.currentSlide + 1].outerHTML
        : "",
    currentSlideNum: window.slidesk.currentSlide,
    totalSlides: window.slidesk.slides.length,
    timestamp: Date.now(),
  };
  localStorage.setItem("slidesk_current_slide", JSON.stringify(slideData));

  if (
    window.slidesk.io &&
    (window.location.hostname === window.slidesk.domain ||
      window.location.hostname === "localhost")
  ) {
    window.slidesk.sendMessage({
      action: "current",
      payload: window.slidesk.slides[window.slidesk.currentSlide].outerHTML,
    });
    window.slidesk.sendMessage({
      action: "future",
      payload:
        window.slidesk.currentSlide !== window.slidesk.slides.length - 1
          ? window.slidesk.slides[window.slidesk.currentSlide + 1].outerHTML
          : "",
    });
    window.slidesk.sendMessage({
      action: "goto",
      payload: window.slidesk.currentSlide,
    });
  }

  window.slidesk.slides[window.slidesk.currentSlide]
    .querySelectorAll(".sd-img img")
    .forEach((i, _) => {
      i.setAttribute("style", "");
      i.setAttribute("src", i.getAttribute("data-src"));
    });
  window.slidesk.onSlideChange();
};

window.slidesk.next = () => {
  if (window.slidesk.currentSlide !== window.slidesk.slides.length - 1) {
    window.slidesk.lastAction = "next";
    window.slidesk.cleanOldSlide(window.slidesk.currentSlide);
    window.slidesk.slides[window.slidesk.currentSlide].classList.add(
      "sd-previous",
    );
    window.slidesk.currentSlide += 1;
    window.slidesk.changeSlide();
  }
};

window.slidesk.previous = () => {
  if (window.slidesk.currentSlide !== 0) {
    window.slidesk.lastAction = "previous";
    window.slidesk.cleanOldSlide(window.slidesk.currentSlide);
    window.slidesk.currentSlide -= 1;
    window.slidesk.changeSlide();
  }
};

window.slidesk.goto = (num) => {
  const n = num.data ?? num;
  if (n >= 0 && n < window.slidesk.slides.length) {
    window.slidesk.cleanOldSlide(window.slidesk.currentSlide);
    window.slidesk.slides.forEach((s, i) => {
      if (i < n) s.classList.add("sd-previous");
      else s.classList.remove("sd-previous");
    });
    window.slidesk.currentSlide = n;
    window.slidesk.changeSlide();
  }
};

window.slidesk.first = () => window.slidesk.goto(0);

window.slidesk.last = () =>
  window.slidesk.goto(window.slidesk.slides.length - 1);

window.slidesk.black = () => {
  document.querySelector(".sd-app").classList.toggle("sd-black");
};

window.slidesk.fullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
};

window.slidesk.saveCheckpoints = () => {
  const timerCheckpoints = {};
  window.slidesk.slides.forEach((slide, idx) => {
    timerCheckpoints[idx] = slide.getAttribute("data-timer-checkpoint");
  });
  localStorage.setItem(
    "slidesk_checkpoints",
    JSON.stringify({
      timerCheckpoints,
      nbSlides: window.slidesk.slides.length,
    }),
  );
};

window.onload = () => {
  window.slidesk.slides = document.querySelectorAll(".sd-slide");
  if (window.slidesk.io) {
    const timerCheckpoints = {};
    window.slidesk.slides.forEach((slide, _) => {
      timerCheckpoints[slide.getAttribute("data-num")] = slide.getAttribute(
        "data-timer-checkpoint",
      );
    });
    window.slidesk.sendMessage({
      action: "checkpoints",
      payload: {
        timerCheckpoints,
        nbSlides: window.slidesk.slides.length,
      },
    });
  } else window.slidesk.setupChannel();
  const loadingHash = window.location.hash.replace("#", "");
  window.slidesk.currentSlide = Number(loadingHash ?? 0);
  if (window.slidesk.currentSlide < 0) window.slidesk.currentSlide = 0;
  if (window.slidesk.currentSlide) {
    for (let i = 0; i < window.slidesk.currentSlide; i += 1) {
      window.slidesk.slides[i].classList.add("sd-previous", "no-sd-animation");
    }
    setTimeout(() => {
      for (let i = 0; i < window.slidesk.currentSlide; i += 1) {
        window.slidesk.slides[i].classList.remove("no-sd-animation");
      }
    }, window.slidesk.animationTimer);
  }
  window.slidesk.slides[window.slidesk.currentSlide].classList.add(
    "sd-current",
    "no-sd-animation",
  );
  document.querySelectorAll(".sd-img img").forEach((img, _) => {
    img.addEventListener("load", () => {
      let ratio = 1;
      if (Number(window.slidesk.env?.slidesk?.WIDTH))
        ratio = window.innerWidth / Number(window.slidesk.env.slidesk.WIDTH);
      const newW = `${ratio * img.width}px`;
      const newH = `${ratio * img.height}px`;
      img.parentElement.style.width = newW;
      img.parentElement.style.height = newH;
      img.style.width = newW;
      img.style.height = newH;
    });
  });
  window.slidesk.changeSlide();
  document.querySelectorAll(".sd-slide").forEach((slide, _) => {
    slide.addEventListener("touchstart", (e) => {
      e.preventDefault();
      window.slidesk.touchStart = e.touches[0].pageX;
      window.slidesk.touchMove = e.touches[0].pageX;
    });
    slide.addEventListener("touchmove", (e) => {
      window.slidesk.touchMove = e.touches[0].pageX;
    });
    slide.addEventListener("touchend", (_) => {
      if (
        Math.abs(window.slidesk.touchMove - window.slidesk.touchStart) > 100
      ) {
        if (window.slidesk.touchMove > window.slidesk.touchStart)
          window.slidesk.previous();
        else window.slidesk.next();
      }
      window.slidesk.touchStart = 0;
    });
  });
  window.slidesk.timeoutResize = false;
  window.addEventListener("resize", () => {
    clearTimeout(window.slidesk.timeoutResize);
    window.slidesk.timeoutResize = setTimeout(() => {
      window.location.reload();
    }, 250);
  });
};

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
  f: "fullscreen",
};

document.addEventListener("keydown", (e) => {
  if (
    window.location.hostname === window.slidesk.domain ||
    window.location.hostname === "localhost" ||
    window.location.origin === "file://" ||
    window.slidesk.deployed
  ) {
    const action = window.slidesk.keys[e.key];
    if (action) {
      e.preventDefault();
      window.slidesk[action]();
    }
  }
});

let timeoutMouse = null;
const hideMouse = () => {
  document.querySelector(".sd-app").style.cursor = "none";
};

document.addEventListener("mousemove", () => {
  clearTimeout(timeoutMouse);
  timeoutMouse = setTimeout(() => {
    hideMouse();
  }, 250);
  document.querySelector(".sd-app").style.cursor = "default";
});
