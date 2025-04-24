import { readdirSync } from "node:fs";
import type { SliDeskPlugin, SliDeskPresentOptions } from "../../types";
import polish from "./polish";
import translate from "../../components/translate";
import type { DotenvParseOutput } from "dotenv";

export default async (
  presentation: string,
  template: string,
  sdfPath: string,
  options: SliDeskPresentOptions,
  env: DotenvParseOutput,
  plugins: SliDeskPlugin[],
) => {
  const langFiles = readdirSync(sdfPath).filter((item) =>
    /.lang.json$/gi.test(item),
  );
  let content = "";
  if (langFiles.length) {
    let translations: object | null = null;
    await Promise.all(
      langFiles.map(async (lang) => {
        const langSlug = lang.replace(".lang.json", "");
        const translationJSON = await Bun.file(`${sdfPath}/${lang}`).json();
        if (
          options.lang === langSlug ||
          (translationJSON.default && translations === null)
        )
          translations = translationJSON;
      }),
    );
    content = await polish(
      translate(presentation, translations),
      template,
      env,
      plugins,
    );
  } else {
    content = await polish(presentation, template, env, plugins);
  }
  return {
    "index.html": {
      content,
      headers: {
        "Content-Type": "text/html",
      },
    },
  };
};
