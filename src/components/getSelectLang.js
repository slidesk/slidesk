const getSelectLang = (menuLang, key) =>
  `<select id="sd-langs" onchange="window.location.href = this.value;">${menuLang
    .map(
      (o) =>
        `<option value="${o.value}" ${key === "index.html" ? "selected" : ""}>${
          o.label
        }</option>`,
    )
    .join("")}</select></body>`;

export default getSelectLang;
