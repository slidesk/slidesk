export default function comments(data) {
  let newData = data;
  const regex = /\/\*([^*]|(\*+[^*/]))*\*\//gm;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = regex.exec(newData)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex += 1;
    }
    newData = newData.replace(
      m[0],
      `<aside class="sd-notes">${m[0]
        .replace("/*", "")
        .replace("*/", "")
        .split("\n")
        .slice(1)
        .join("<br/>")}</aside>`,
    );
  }
  return newData;
}
