const links = (data) => {
  const reg = /s?:\/\/([a-zA-Z0-9.-]+(:\d+)?([a-zA-Z0-9._\-/~=?@]*\/?))/g;
  return data
    .split("http")
    .map((d, i) => {
      if (i === 0) return d;
      if (!d.match(reg)) return `http${d}`;
      if (d.indexOf('">') !== -1) return `http${d}`;
      let nd = d;
      [...nd.matchAll(reg)].forEach((m) => {
        nd = nd.replace(
          m[0],
          `<a href="http${m[0]}" target="_blank" rel="noopener">http${m[0]}</a>`,
        );
      });
      return nd;
    })
    .join("");
};

export default links;
