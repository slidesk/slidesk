import { css } from "#assets_css";

export const speaker_view = `
<!DOCTYPE html>
<html>
  <head>
    <link rel="icon" href="/favicon.svg" />
    <title>Speaker View</title>
    <style>
      ${css}

      :root {
        --tf-sv-timer-size: 80px;
        --tf-sv-text-size: 40px;
        --tf-sv-text-line-height: 1.2;
        --tf-sv-background-color: #242424;
        --tf-sv-text-color: rgba(255, 255, 255, 0.87);
      }

      body {
        display: flex;
        flex-direction: row;
      }

      #tf-sv-left, #tf-sv-right {
        width: 50%;
        height: 100%;
        margin: 0;
      }

      #tf-sv-left .📽️ {
        height: 50%;
        box-sizing: border-box;
        border: 1px solid white;
      }

      #tf-sv-left .📽️ .🎞️ {
        transform: translateX(0);
        transition-duration: 0ms;
        zoom: 0.5;
      }

      #tf-sv-left #tf-sv-future:after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgb(18, 18, 18, 0.65);
      }

      #tf-sv-right {
        display: flex;
        flex-direction: column;
      }

      #tf-sd-timer {
        background-color: var(--tf-sv-background-color);
        color: var(--tf-sv-text-color);
        font-size: var(--tf-sv-timer-size);
        line-height: var(--tf-sv-text-line-height);
        padding: 10px;
        border-bottom: 1px solid white;
        text-align: right;
        cursor: pointer;
        font-family: monospace;
      }

      #tf-sv-notes {
        flex-grow: 1;
        background-color: var(--tf-sv-background-color);
        color: var(--tf-sv-text-color);
        font-size: var(--tf-sv-text-size);
        line-height: var(--tf-sv-text-line-height);
        padding: 10px;
        overflow: scroll;
      }
    </style>
  </head>
  <body>
    <div id="tf-sv-left">
      <main id="tf-sv-current" class="📽️"></main>
      <main id="tf-sv-future" class="📽️"></main>
    </div>
    <div id="tf-sv-right">
      <div id="tf-sd-timer">Click to (re)start</div>
      <aside id="tf-sv-notes"></aside>
    </div>
    <script>
      window.talkflow = { io: {}, timer: document.querySelector("#tf-sd-timer") };
      #SOCKETIO#
      const makeSlide = (slide) => slide.replace("data-src", "src");
      window.talkflow.io.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === "current") {
          const current = document.querySelector("#tf-sv-current");
          current.innerHTML = makeSlide(data.payload);
          document.querySelector("#tf-sv-notes").innerHTML = [
            ...current.querySelectorAll("aside.📝"),
          ]
            .map((a) => a.innerHTML)
            .join("");
        }
        if (data.action === "future") {
          document.querySelector("#tf-sv-future").innerHTML = makeSlide(data.payload);
        }
        if (data.action === "customcss") {
          document.querySelector("head").innerHTML +=
            '<link rel="stylesheet" href="' + data.payload + '">';
        }
        if (data.action === "customsvjs") {
          const s = document.createElement("script");
          s.src = data.payload;
          document.querySelector("body").append(s)
        }
      };
      document.addEventListener("keydown", (e) => {
        if (e.key == "ArrowLeft") {
          window.talkflow.io.send(JSON.stringify({ action: "previous" }));
        } else if (e.key == "ArrowRight" || e.key == " ") {
          window.talkflow.io.send(JSON.stringify({ action: "next" }));
        }
      });
      let startTime = null;
      const toHHMMSS = (secs) => {
        var sec_num = parseInt(secs, 10)
        var hours   = Math.floor(sec_num / 3600)
        var minutes = Math.floor(sec_num / 60) % 60
        var seconds = sec_num % 60
    
        return [hours,minutes,seconds]
            .map(v => v < 10 ? "0" + v : v)
            .filter((v,i) => v !== "00" || i > 0)
            .join(":")
      }
      setInterval(() => {
        if (startTime)
          window.talkflow.timer.innerText = toHHMMSS((Date.now() - startTime) / 1000);
      }, 1000);
      window.talkflow.timer.addEventListener("click", () => {
        startTime = Date.now();
      });
    </script>
  </body>
</html>
`;
