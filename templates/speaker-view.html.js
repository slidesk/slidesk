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
      <aside id="tf-sv-notes"></aside>
    </div>
    <script>
      window.talkflow = { io : {} };
      #SOCKETIO#
      const makeSlide = (slide) => {
        return '<section class="🎞️">' + slide.replace("data-src", "src") + '</section>'
      };
      window.talkflow.io.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'current') {
          const current = document.querySelector('#tf-sv-current');
          current.innerHTML = makeSlide(data.payload);
          document.querySelector('#tf-sv-notes').innerHTML = [...current.querySelectorAll('aside.📝')].map((a) => a.innerHTML).join("");
        }
        if (data.action === 'future') {
          document.querySelector('#tf-sv-future').innerHTML = makeSlide(data.payload);
        }
        if (data.action === 'customcss') {
          document.querySelector('head').innerHTML += '<link rel="stylesheet" href="' + data.payload + '">';
        }
      }
      document.addEventListener("keydown", (e) => {
        if (e.key == "ArrowLeft") {
          window.talkflow.io.send(JSON.stringify({ action: 'previous' }));
        } else if (e.key == "ArrowRight" || e.key == " ") {
          window.talkflow.io.send(JSON.stringify({ action: 'next' }));
        }
      });
    </script>
  </body>
</html>
`;
