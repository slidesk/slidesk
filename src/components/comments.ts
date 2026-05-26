import markdownIt from "markdown-it";

const md = markdownIt({
  html: true,
  xhtmlOut: true,
  linkify: true,
  typographer: true,
});

export default function comments(data: string) {
  let newData = data;
  [...newData.matchAll(/\n\/\*([^*]|(\*+[^*/]))*\n\*\//gm)].forEach(
    (match, _) => {
      newData = newData.replace(
        match[0],
        `<aside class="sd-notes">${btoa(
          encodeURIComponent(
            md.render(match[0].replace("/*", "").replace("*/", "")).toString(),
          ).replaceAll(/%([a-f0-9]{2})/gi, (_, $1) =>
            String.fromCodePoint(Number.parseInt($1, 16)),
          ),
        )}</aside>`,
      );
    },
  );
  return newData;
}
