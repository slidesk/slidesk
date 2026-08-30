export default function comments(data: string) {
  let newData = data;
  [...newData.matchAll(/\n\/\*([^*]|(\*+[^*/]))*\n\*\//gm)].forEach(
    (match, _) => {
      newData = newData.replace(
        match[0],
        `<aside class="sd-notes">${btoa(
          encodeURIComponent(
            Bun.markdown.html(match[0].replace("/*", "").replace("*/", ""), {
              tables: true,
              strikethrough: true,
              tasklists: true,
              autolinks: true,
              headings: true,
              underline: true,
              latexMath: true,
            }),
          ).replaceAll(/%([a-f0-9]{2})/gi, (_, $1) =>
            String.fromCodePoint(Number.parseInt($1, 16)),
          ),
        )}</aside>`,
      );
    },
  );
  return newData;
}
