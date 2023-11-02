const fromBinary = (encoded) => {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return String.fromCharCode(...new Uint16Array(bytes.buffer));
};

window.slidesk.changeSource = () => {
  document.querySelector("#sd-source pre").innerText = fromBinary(
    window.slidesk.slides[window.slidesk.currentSlide].getAttribute(
      "data-source",
    ),
  );
};
