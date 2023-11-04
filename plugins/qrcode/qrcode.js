window.slidesk.qrcode = () => {
  document.getElementById("sd-qrcode").innerHTML = "";
  new QRCode(document.getElementById("sd-qrcode"), {
    text: window.location.href,
    width: 96,
    height: 96,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L,
  });
};
