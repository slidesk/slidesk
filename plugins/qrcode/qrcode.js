window.slidesk.qrcode = () => {
  document.getElementById("sd-qrcode").innerHTML = window.QRCodeRender(
    window.QRCodeGetMatrix(window.location.href),
    "#000",
  );
};
