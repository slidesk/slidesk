# Create plugins

Plugins extend SliDesk with front-end scripts, styles, server-side routes, and WebSocket handlers.

## Structure

Create a `plugins/<name>/` directory in your talk with a `plugin.json` defining hooks:

```json
{
  "addStyles": ["./plugins/webcam/webcam.css"],
  "addScripts": ["./plugins/webcam/webcam.js"]
}
```

## Front-end plugins

Front-end hooks add resources or code to the presentation:

| Hook | Type | Description |
|------|------|-------------|
| `addHTML` | string | HTML injected at the end of the body |
| `addHTMLFromFiles` | string[] | HTML file paths to append |
| `addScripts` | string[] | Script URLs as `<script src="...">` |
| `addScriptModules` | string[] | ES modules as `<script type="module">` |
| `addSpeakerScripts` | string[] | Scripts for speaker view only |
| `addStyles` | string[] | CSS URLs as `<link rel="stylesheet">` |
| `addSpeakerStyles` | string[] | CSS for speaker view only |
| `onSlideChange` | string | JS executed after each slide change |
| `onSpeakerViewSlideChange` | string | JS executed after slide change in speaker view |

### Example: Webcam plugin

```json
{
  "addStyles": ["./plugins/webcam/webcam.css"],
  "addScripts": ["./plugins/webcam/webcam.js"]
}
```

```js
const video = document.querySelector("#webcam");

async function openCamera(cameraId, minWidth, minHeight) {
  const constraints = {
    video: { deviceId: cameraId, width: { min: minWidth }, height: { min: minHeight } },
  };
  return await navigator.mediaDevices.getUserMedia(constraints);
}

const webcamize = async () => {
  const cameras = await navigator.mediaDevices.enumerateDevices();
  const cam = cameras.find(c => c.label.includes(window.slidesk.env.WEBCAM));
  if (cam) {
    openCamera(cam.deviceId, 1280, 720).then(stream => video.srcObject = stream);
  }
};

webcamize();
```

Add `<video autoplay id="webcam"></video>` in your slide.

## Back-end HTTP plugin

Use the `addRoutes` hook to add HTTP routes:

```json
{
  "addRoutes": "./plugins/myplugin/back/routes.mjs"
}
```

```js
export default async (req, env) => {
  const url = new URL(req.url);
  if (url.pathname === "/public") {
    const text = await Bun.file(
      `${globalThis.path}/plugins/myplugin/back/index.html`
    ).text();
    return new Response(text, {
      headers: { "Content-Type": "text/html" },
    });
  }
  return null;
};
```

## Back-end WebSocket plugin

Use the `addWS` hook for WebSocket handlers:

```json
{
  "addWS": "./plugins/myplugin/back/ws.mjs"
}
```

```js
export default async (message) => {
  const { cwd, command, key } = JSON.parse(message);
  const proc = Bun.spawn(command.split(" "), { cwd: cwd ?? process.env.HOME });
  return {
    key,
    result: await new Response(proc.stdout).text(),
  };
};
```

## Push to the hub

```sh
slidesk plugin push my-plugin
```

See [manage addons](/how-to/manage-addons).
