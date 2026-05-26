# How to write a Front plugin ?

The `hooks` used in front plugin are:

| Hook | Type | Description |
|------|------|-------------|
| `addHTML` | string | HTML injected at the end of the presentation body |
| `addHTMLFromFiles` | string[] | Array of HTML file paths to append in the body |
| `addScripts` | string[] | Script URLs loaded as `<script src="...">` |
| `addScriptModules` | string[] | Script URLs loaded as `<script type="module" src="...">` |
| `addSpeakerScripts` | string[] | Script URLs loaded only in the speaker view |
| `addStyles` | string[] | CSS URLs loaded as `<link rel="stylesheet" href="...">` |
| `addSpeakerStyles` | string[] | CSS URLs loaded only in the speaker view |
| `onSlideChange` | string | JavaScript code executed after each slide change |
| `onSpeakerViewSlideChange` | string | JavaScript code executed after each slide change in speaker view |

## Creation of a Webcam plugin

First, create a directory `plugins/webcam` in your talk repository

Consider the following `plugin.json`:

```json
{
  "addStyles": ["./plugins/webcam/webcam.css"],
  "addScripts": ["./plugins/webcam/webcam.js"]
}
```

In the `webcam.js`, we will code the connexion to the webcam and the display:

```js
const video = document.querySelector("#webcam");

async function getConnectedDevices(type) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === type);
}

async function openCamera(cameraId, minWidth, minHeight) {
  const constraints = {
    video: {
      deviceId: cameraId,
      width: { min: minWidth },
      height: { min: minHeight },
    },
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
}

const webcamize = async () => {
  const cameras = await getConnectedDevices("videoinput");
  if (cameras && cameras.length > 0) {
    cameras.forEach((camera) => {
      console.log(camera, window.slidesk.env.WEBCAM);
      if (camera.label.includes(window.slidesk.env.WEBCAM)) {
        console.log("camera found");
        openCamera(camera.deviceId, 1280, 720).then(
          (stream) => (video.srcObject = stream)
        );
      }
    });
  }
};

webcamize();
```

Then in the slide, you can add `<video autoplay="true" id="webcam"></video>` where you want the webcam.
