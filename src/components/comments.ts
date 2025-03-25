export default function comments(data: string) {
  let newData = data;
  [...newData.matchAll(/\n\/\*([^*]|(\*+[^*/]))*\n\*\//gm)].forEach(
    (match, _) => {
      newData = newData.replace(
        match[0],
        `<aside class="sd-notes">${match[0]
          .replace("/*", "")
          .replace("*/", "")
          .split("\n")
          .slice(1)
          .join("<br/>")}</aside>`,
      );
    },
  );
  return newData;
}
