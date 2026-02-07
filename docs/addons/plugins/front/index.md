# How to write a Front plugin ?

The `hooks` used in front plugin are:

- `addHTML`: add some html at the end of the presentation
- `addHTMLFromFiles`: an array of html files to append in the `body`
- `addScripts`: an array of ressources to load (will be convert to `script` tag with `src` value as each entry)
- `addScriptModules`: an array of ressources to load as modules (will be convert to `script` tag with `src` value as each entry and `type="module"`)
- `addSpeakerScripts`: an array of ressources to load (will be convert to `script` tag with `src` value as each entry) but on speaker view
- `addStyles`: an array of ressources to load (will be convert to `link` tag with `href` value as each entry)
- `addSpeakerStyles`: an array of ressources to load (will be convert to `link` tag with `href` value as each entry) but on speaker view
- `onSlideChange`: javascript code which will be executed after a slide is changed
- `onSpeakerViewSlideChange`: javascript code which will be executed after a slide is changed

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
