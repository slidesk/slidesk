type Translations = { translations: { [key: string]: string } } | null;

const replaceKeys = (text: string, json: Translations) =>
  // a function, so that "$$" or "$&" in a translation are inserted as written
  text.replaceAll(
    /\${2}(\w+)\${2}/g,
    (key, name: string) => json?.translations[name] ?? key,
  );

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
