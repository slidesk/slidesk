const getSelectLang = (menuLang) =>
  `<select id="sd-langs" onchange="window.location.href = this.value;">${menuLang
    .map((o) => `<option value="${o.value}">${o.label}</option>`)
    .join(
      "",
    )}</select><script>[...document.querySelectorAll("#sd-langs option")].forEach((option) => {if (option.value === window.location.pathname) option.setAttribute("selected", true);})</script></body>`;

export default getSelectLang;
