import { css } from "#assets_css";

export const speakerView = `
<!DOCTYPE html>
<html>
  <head>
    <link rel="icon" href="/favicon.svg" />
    <title>Speaker View</title>
    <style>
      ${css}

      :root {
        --sd-sv-timer-size: 80px;
        --sd-sv-text-size: 40px;
        --sd-sv-text-line-height: 1.2;
        --sd-sv-background-color: #242424;
        --sd-sv-text-color: rgba(255, 255, 255, 0.87);
      }

      body {
        display: flex;
        flex-direction: row;
      }

      #sd-sv-left, #sd-sv-right {
        width: 50%;
        height: 100%;
        margin: 0;
      }

      #sd-sv-left .📽️ {
        height: 50%;
        box-sizing: border-box;
        border: 1px solid white;
      }

      #sd-sv-left .📽️ .🎞️ {
        transform: translateX(0);
        transition-duration: 0ms;
        zoom: 0.5;
      }

      #sd-sv-left #sd-sv-future:after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgb(18, 18, 18, 0.65);
      }

      #sd-sv-right {
        display: flex;
        flex-direction: column;
      }

      #sd-sv-timer {
        background-color: var(--sd-sv-background-color);
        color: var(--sd-sv-text-color);
        font-size: var(--sd-sv-timer-size);
        line-height: var(--sd-sv-text-line-height);
        padding: 10px;
        border-bottom: 1px solid white;
        text-align: right;
        cursor: pointer;
        font-family: monospace;
      }

      #sd-sv-notes {
        flex-grow: 1;
        background-color: var(--sd-sv-background-color);
        color: var(--sd-sv-text-color);
        font-size: var(--sd-sv-text-size);
        line-height: var(--sd-sv-text-line-height);
        padding: 10px;
        overflow: scroll;
      }
    </style>
  </head>
  <body>
    <div id="sd-sv-left">
      <main id="sd-sv-current" class="📽️"></main>
      <main id="sd-sv-future" class="📽️"></main>
    </div>
    <div id="sd-sv-right">
      <div id="sd-sv-timer">Click to (re)start</div>
      <aside id="sd-sv-notes"></aside>
    </div>
    <script>
      window.slidesk = { 
        io: {}, 
        timer: document.querySelector("#sd-sv-timer") 
      };
      #SOCKETS#
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
          document.querySelector("body").append(s)
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
          window.slidesk.timer.innerText = toHHMMSS((Date.now() - startTime) / 1000);
      }, 1000);
      window.slidesk.timer.addEventListener("click", () => {
        startTime = Date.now();
      });
    </script>
  </body>
</html>
`;
