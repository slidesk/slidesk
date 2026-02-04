export default function comments(data: string) {
  let newData = data;
  [...newData.matchAll(/\n\/\*([^*]|(\*+[^*/]))*\n\*\//gm)].forEach(
    (match, _) => {
      newData = newData.replace(
        match[0],
        `<aside class="sd-notes">${btoa(
          encodeURIComponent(
            match[0]
              .replace("/*", "")
              .replace("*/", "")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")
              .split("\n")
              .slice(1)
              .join("<br/>"),
          ).replace(/%([a-f0-9]{2})/gi, (_, $1) =>
            String.fromCharCode(parseInt($1, 16)),
          ),
        )}</aside>`,
      );
    },
  );
  return newData;
}
