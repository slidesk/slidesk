import { existsSync, readdirSync } from "node:fs";
import translate from "../../components/translate";
import type {
  SliDeskEnv,
  SliDeskPlugin,
  SliDeskPresentOptions,
} from "../../types";
import { CliError } from "../../utils/cliError";
import polish from "./polish";

const LANG_FILE = /\.lang\.json$/i;

type LangFile = { default?: boolean; translations?: Record<string, string> };

/** The `<lang>.lang.json` files of `dir`, read, sorted by language. */
const readLangs = async (dir: string) => {
  const files = readdirSync(dir)
    .filter((f) => LANG_FILE.test(f))
    .sort((a, b) => a.localeCompare(b));
  return Promise.all(
    files.map(async (f) => ({
      lang: f.replace(LANG_FILE, ""),
      json: (await Bun.file(`${dir}/${f}`).json()) as LangFile,
    })),
  );
};

/** The file in `lang`, or else the default one. */
const pick = (langs: Awaited<ReturnType<typeof readLangs>>, lang?: string) =>
  langs.find((l) => l.lang === lang) ?? langs.find((l) => l.json.default);

/** `html` marked with the language of the talk, for screen readers and hyphenation. */
export const withLang = (html: string, lang?: string) =>
  lang && /^[\w-]+$/.test(lang)
    ? html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
    : html;

/** The language of the talk: --lang, or else its default translation file. */
export const talkLang = async (sdfPath: string, lang?: string) =>
  lang ?? pick(await readLangs(sdfPath))?.lang;

const generateHTML = async (
  presentation: string,
  template: string,
  sdfPath: string,
  options: SliDeskPresentOptions,
  env: SliDeskEnv,
  plugins: SliDeskPlugin[],
) => {
  const talk = await readLangs(sdfPath);
  // a theme translates its own templates, in the language of the talk
  const themesDir = `${sdfPath}/themes`;
  const themes = existsSync(themesDir)
    ? await Promise.all(
        readdirSync(themesDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .sort((a, b) => a.localeCompare(b))
          .map((t) => readLangs(`${themesDir}/${t}`)),
      )
    : [];
  const available = [
    ...new Set([...talk, ...themes.flat()].map((l) => l.lang)),
  ].sort((a, b) => a.localeCompare(b));
  if (options.lang && !available.includes(options.lang))
    throw new CliError(
      `${options.lang}.lang.json not found${
        available.length ? ` (available: ${available.join(", ")})` : ""
      }`,
    );
  const lang = options.lang ?? pick(talk)?.lang;
  // the talk has the last word over its themes
  const translations = Object.assign(
    {},
    ...[...themes, talk].map((langs) => pick(langs, lang)?.json.translations),
  );
  const title = env.slidesk?.TITLE;
  const content = await polish(
    available.length ? translate(presentation, { translations }) : presentation,
    withLang(template, lang),
    // the tab is named in the language of the talk
    title && available.length
      ? {
          ...env,
          slidesk: {
            ...env.slidesk,
            TITLE: translate(title, { translations }),
          },
        }
      : env,
    plugins,
  );
  return {
    "index.html": {
      content,
      headers: {
        "Content-Type": "text/html",
      },
    },
  };
};

export default generateHTML;
