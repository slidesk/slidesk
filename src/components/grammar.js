const grammar = (data) => {
  let htmlData = data;
  [
    ["=", "s"],
    ["_", "i"],
    ["\\*", "b"],
    ["`", "code"],
    ["˜", "u"],
  ].forEach((couple) => {
    if (
      (htmlData.match(new RegExp(`${couple[0]}{2}`)) || []).length &&
      !htmlData.includes("data-source")
    ) {
      htmlData = [...htmlData.split(new RegExp(`${couple[0]}{2}`))]
        .map((t, i) => {
          if (i % 2) return `<span class="${couple[1]}">${t}</span>`;
          return t;
        })
        .join("");
    }
  });
  return htmlData;
};

export default grammar;
