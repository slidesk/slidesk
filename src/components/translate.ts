type Translations = { translations: { [key: string]: string } } | null;

/**
 * The inline markdown of a translation, as HTML: a sentence is translated as
 * a whole, its bold, italic, code or links included. A value that is not a
 * single paragraph ("1. Intro", "# Title") is kept as written.
 */
const inline = (value: string) => {
  const html = Bun.markdown.html(value, {
    strikethrough: true,
    autolinks: true,
    underline: true,
    latexMath: true,
  });
  const paragraph = /^<p>([\s\S]*)<\/p>\n$/.exec(html);
  return paragraph && !paragraph[1].includes("<p>") ? paragraph[1] : value;
};

const replaceKeys = (text: string, json: Translations) =>
  // a function, so that "$$" or "$&" in a translation are inserted as written
  text.replaceAll(/\${2}(\w+)\${2}/g, (key, name: string) => {
    const value = json?.translations[name];
    return value === undefined ? key : inline(value);
  });

/** Replaces the `$$key$$` of the slides, and of their speaker notes. */
const translate = (presentation: string, json: Translations) =>
  replaceKeys(presentation, json).replaceAll(
    // notes are base64 of their UTF-8 html (see comments.ts): decoded, translated, encoded back
    /(<aside class="sd-notes">)([^<]*)(<\/aside>)/g,
    (_, open: string, notes: string, close: string) =>
      `${open}${Buffer.from(
        replaceKeys(Buffer.from(notes, "base64").toString("utf8"), json),
      ).toString("base64")}${close}`,
  );

export default translate;
