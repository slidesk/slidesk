const gamepad = () => {
  window.addEventListener("gamepadconnected", () => {
    setInterval(() => {
      for (const gamepad of navigator.getGamepads()) {
        if (!gamepad) continue;
        for (const [index, axis] of gamepad.axes.entries()) {
          if (index == 0) {
            if (axis == -1) {
              // console.log("left");
            } else if (axis == 1) {
              // console.log("right");
            }
          } else if (index == 1) {
            if (axis == -1) {
              // console.log("up");
            } else if (axis == 1) {
              // console.log("down");
            }
          }
        }
        for (const [index, button] of gamepad.buttons.entries()) {
          if (button.pressed) {
            // console.log(button, index);
            if (index == 12) {
              /* up */
            } else if (index == 13) {
              /* down */
            } else if (index == 15)
              window.slidesk.io.send(JSON.stringify({ action: "next" })); // ->
            else if (index == 14)
              window.slidesk.io.send(JSON.stringify({ action: "previous" }));
            // <-
            else if (index == 6)
              window.slidesk.io.send(JSON.stringify({ action: "next" })); // L2
            else if (index == 7)
              window.slidesk.io.send(JSON.stringify({ action: "previous" })); // R2
          }
        }
      }
    }, 500);
  });
};

gamepad();
