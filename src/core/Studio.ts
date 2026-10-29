import { mkdir } from "node:fs/promises";
import { BROWSER, localize, text } from "../commands/design";
import studioHTML from "../templates/studio/index.html" with { type: "text" };
// @ts-expect-error: read as text, TypeScript sees its exports
import stageJS from "../templates/studio/stage.js" with { type: "text" };
import {
  type AddonKind,
  addonInstall,
  addonRemove,
  installedAddons,
} from "../utils/addon";
import { CliError } from "../utils/cliError";
import { hubFetch } from "../utils/hub";
import loadTemplates from "./babelfish/loadTemplates";
import { edit, outline, type StudioEdit } from "./studio/slides";

// loaded after the theme of the talk whatever the order, thanks to :root:root
const THEME = "themes/studio/studio.css";

/** A page of this machine only: not another site, nor one rebinding its name to it. */
const trusted = (req: Request) => {
  const host = req.headers.get("host") ?? "";
  if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host)) return false;
  return req.method === "GET" || req.headers.get("origin") === `http://${host}`;
};

// the rules the studio writes: a family per kind of text
const FONTS = {
  font: ":root:root .sd-app",
  "heading-font": ":root:root .sd-slide :is(h1, h2, h3)",
};

type Theme = Record<string, string>;

const faces = (css: string) => css.match(/@font-face\s*\{[^}]*\}/gi) ?? [];

const readTheme = async (talkdir: string): Promise<Theme> => {
  const css = await Bun.file(`${talkdir}/${THEME}`)
    .text()
    .catch(() => "");
  return Object.fromEntries([
    ...[...css.matchAll(/(--sd-[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [
      k,
      v.trim(),
    ]),
    ...Object.entries(FONTS).flatMap(([key, rule]) => {
      const family = new RegExp(
        `${RegExp.escape(rule)} \\{\\s*font-family: "([^"]+)"`,
      ).exec(css)?.[1];
      return family ? [[key, family]] : [];
    }),
  ]);
};

/** The @font-face rules of a Google font, its files downloaded next to the theme; none for another font. */
const download = async (family: string, dir: string) => {
  const name = family.replaceAll(" ", "+");
  for (const query of [`${name}:ital,wght@0,400;0,700;1,400;1,700`, name]) {
    const css = await text(
      `https://fonts.googleapis.com/css2?family=${query}&display=swap`,
      BROWSER,
    ).catch(() => "");
    if (css) return faces(await localize(css, dir));
  }
  return [];
};

const writeTheme = async (talkdir: string, theme: Theme) => {
  const previous = faces(
    await Bun.file(`${talkdir}/${THEME}`)
      .text()
      .catch(() => ""),
  );
  const colors = Object.entries(theme).filter(
    ([k, v]) => /^--sd-[\w-]+$/.test(k) && /^#[\da-f]{3,8}$/i.test(v),
  );
  // a name, not css: it goes into the stylesheet
  const fonts = Object.entries(FONTS).flatMap(([key, rule]) =>
    /^[\w -]{1,60}$/.test(theme[key] ?? "") ? [[theme[key], rule]] : [],
  );
  const families = [...new Set(fonts.map(([family]) => family))];
  const used = await Promise.all(
    families.map(async (family) => {
      const kept = previous.filter(
        (f) => f.includes(`"${family}"`) || f.includes(`'${family}'`),
      );
      return kept.length ? kept : download(family, `${talkdir}/themes/studio`);
    }),
  );
  await Bun.write(
    `${talkdir}/${THEME}`,
    `${[
      ...used.flat(),
      `:root:root {\n${colors.map(([k, v]) => `  ${k}: ${v};\n`).join("")}}`,
      ...fonts.map(
        ([family, rule]) => `${rule} {\n  font-family: "${family}";\n}`,
      ),
    ].join("\n\n")}\n`,
  );
};

const HUB = "https://slidesk.link";
const KINDS: AddonKind[] = ["template", "plugin", "component", "theme"];

const search = async (kind: AddonKind, term: string) => {
  const response = await hubFetch(
    `${HUB}/addons/search/${kind}/${encodeURIComponent(term)}`,
  );
  return response.ok ? ((await response.json()) as string[]) : [];
};

/** The addons of slidesk.link matching `term`, and those installed in the talk. */
const addons = async (talkdir: string, kind: AddonKind, term: string) => {
  // the hub only searches: without a term, what holds a vowel stands for all
  // ponytail: an addon named without a vowel is only found by searching it
  const terms = term ? [term] : [..."aeiou"];
  const found = await Promise.all(terms.map((t) => search(kind, t)));
  return {
    found: [...new Set(found.flat())].sort((a, b) => a.localeCompare(b)),
    installed: installedAddons(kind, talkdir),
  };
};

/** Installs or removes an addon in the talk; the presentation rebuilds with it. */
const changeAddon = async (talkdir: string, req: Request) => {
  const { kind, name, remove } = await req.json();
  if (!KINDS.includes(kind))
    return new Response("Unknown kind", { status: 400 });
  try {
    return Response.json(
      remove
        ? await addonRemove(kind, name, talkdir)
        : await addonInstall(kind, name, HUB, false, talkdir),
    );
  } catch (e) {
    if (e instanceof CliError) return new Response(e.message, { status: 400 });
    throw e;
  }
};

const upload = async (talkdir: string, req: Request) => {
  const file = (await req.formData()).get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/"))
    return new Response("An image is expected", { status: 400 });
  const name = `assets/${Date.now()}-${file.name.replaceAll(/[^\w.-]/g, "-")}`;
  await mkdir(`${talkdir}/assets`, { recursive: true });
  await Bun.write(`${talkdir}/${name}`, file);
  return Response.json({ path: name });
};

/** Serves the studio on this machine only: it writes the files of the talk. */
export const startStudio = (
  port: number,
  talkdir: string,
  main: string,
  preview: string,
) => {
  const slides = () => outline(talkdir, main);
  return Bun.serve({
    hostname: "127.0.0.1",
    port,
    async fetch(req) {
      if (!trusted(req)) return new Response("Forbidden", { status: 403 });
      const { pathname } = new URL(req.url);
      if (pathname === "/")
        return new Response(String(studioHTML), {
          headers: { "Content-Type": "text/html" },
        });
      if (pathname === "/stage.js")
        return new Response(String(stageJS), {
          headers: { "Content-Type": "application/javascript" },
        });
      if (pathname === "/api/slides" && req.method === "GET")
        return Response.json({ preview, slides: await slides() });
      if (pathname === "/api/slides" && req.method === "POST") {
        const e: StudioEdit = await req.json();
        // only the files of the talk are written
        const files = new Set((await slides()).map((s) => s.file));
        if (!files.has(e.file) || (e.action === "move" && !files.has(e.to)))
          return new Response("Unknown file", { status: 400 });
        await edit(talkdir, e);
        return Response.json({ preview, slides: await slides() });
      }
      // the presentation, for the thumbnails: from another origin, the page
      // could neither read it nor load its fonts
      if (pathname.startsWith("/preview/"))
        return globalThis
          .fetch(`${preview}${pathname.slice(8)}${new URL(req.url).search}`)
          .then(
            (r) =>
              new Response(r.body, {
                status: r.status,
                headers: {
                  "Content-Type": r.headers.get("Content-Type") ?? "",
                },
              }),
          )
          .catch(() => new Response("No presentation", { status: 502 }));
      // each template once, by the name a slide gives it, with the blocks it fills
      if (pathname === "/api/templates")
        return Response.json(
          Object.entries(await loadTemplates(talkdir))
            .filter(([name]) => !name.includes("/"))
            .map(([name, sdt]) => ({
              name,
              blocks: [
                ...new Set(
                  [...sdt.matchAll(/<sd-([\w-]+) \/>/g)].map(([, b]) => b),
                ),
              ].filter((b) => b !== "title" && b !== "content"),
            })),
        );
      if (pathname === "/api/theme" && req.method === "GET")
        return Response.json(await readTheme(talkdir));
      if (pathname === "/api/theme" && req.method === "POST") {
        await writeTheme(talkdir, await req.json());
        return Response.json(await readTheme(talkdir));
      }
      if (pathname === "/api/addons" && req.method === "GET") {
        const params = new URL(req.url).searchParams;
        const kind = params.get("kind") as AddonKind;
        if (!KINDS.includes(kind))
          return new Response("Unknown kind", { status: 400 });
        return Response.json(
          await addons(talkdir, kind, params.get("q") ?? "").catch(() => ({
            found: [],
            installed: installedAddons(kind, talkdir),
            offline: true,
          })),
        );
      }
      if (pathname === "/api/addons" && req.method === "POST")
        return changeAddon(talkdir, req);
      if (pathname === "/api/upload" && req.method === "POST")
        return upload(talkdir, req);
      return new Response("Not found", { status: 404 });
    },
  });
};
