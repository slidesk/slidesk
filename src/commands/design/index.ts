import { existsSync } from "node:fs";
import { Clipse } from "clipse";
import { CliError } from "../../utils/cliError";
import { hubFetch } from "../../utils/hub";
import slugify from "../../utils/slugify";

// a page linking more stylesheets than this mostly adds widgets, not its look
const MAX_STYLESHEETS = 8;

const COLOR = /#[\da-f]{3,8}\b|rgba?\([^)]*\)/gi;

type Sheet = { css: string; base: string };

const tags = (html: string, name: string) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(([t]) => t);

const attr = (tag: string | undefined, name: string) =>
  tag &&
  new RegExp(`\\s${name}=["']?([^"'\\s>]+)`, "i")
    .exec(tag)?.[1]
    .replaceAll("&amp;", "&");

/** The `{ declarations }` of the innermost rules whose selector matches `selector`. */
const declarations = (css: string, selector: RegExp) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, sel]) => selector.test(sel.trim()))
    .map(([, , decls]) => decls);

const property = (decls: string[], name: string) => {
  for (const d of decls.toReversed()) {
    const value = new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`, "i").exec(
      d,
    )?.[1];
    if (value) return value.replace(/!important/i, "").trim();
  }
};

/** [r, g, b] of a hex or rgb() colour, undefined for anything else. */
const rgb = (color: string) => {
  const hex = /^#([\da-f]{3,8})$/i.exec(color)?.[1];
  if (hex) {
    const full =
      hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex.slice(0, 6);
    return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
  }
  const parts = /^rgba?\(([^)]*)\)$/i.exec(color)?.[1].split(/[\s,/]+/);
  return parts && parts.length >= 3 ? parts.slice(0, 3).map(Number) : undefined;
};

const saturation = ([r, g, b]: number[]) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
};

const isDark = (color: string) => {
  const c = rgb(color);
  return c ? 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] < 128 : false;
};

/** Pulls the colours and fonts of a web page out of its HTML and stylesheets. */
export const extractDesign = (html: string, sheets: Sheet[]) => {
  const css = sheets.map((s) => s.css).join("\n");
  const vars = new Map(
    [...css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)].map(([, k, v]) => [
      k,
      v.trim(),
    ]),
  );
  const resolve = (value?: string, depth = 0): string | undefined =>
    value && depth < 5
      ? value.replaceAll(
          /var\((--[\w-]+)\s*(?:,\s*([^)]+))?\)/g,
          (_, k, fb) => resolve(vars.get(k) ?? fb, depth + 1) ?? "",
        )
      : value;
  const color = (value?: string) => resolve(value)?.match(COLOR)?.[0];
  const byName = (name: RegExp) =>
    [...vars].map(([k, v]) => name.test(k) && color(v)).find(Boolean) ||
    undefined;

  const root = declarations(css, /(^|,\s*)(html|body|:root)\s*(,|$)/i);
  const h1 = declarations(css, /(^|,\s*)h1\s*(,|$)/i);
  const themeColor =
    /<meta[^>]+name=["']theme-color["'][^>]*content=["']([^"']+)/i.exec(
      html,
    )?.[1];
  // the most used saturated colour, when the site names none
  const counts = new Map<string, number>();
  for (const [c] of css.matchAll(COLOR)) {
    const v = rgb(c);
    if (v && saturation(v) > 0.4 && Math.max(...v) > 60)
      counts.set(c.toLowerCase(), (counts.get(c.toLowerCase()) ?? 0) + 1);
  }
  const frequent = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];

  const background =
    color(property(root, "background-color")) ??
    color(property(root, "background")) ??
    byName(/^--(.*-)?(background|bg)(-color)?$/i) ??
    "#ffffff";
  // a colour from another part of the site may not read on this background
  const readable = (c?: string) =>
    c && isDark(c) !== isDark(background) ? c : undefined;
  const text =
    readable(color(property(root, "color"))) ??
    readable(byName(/^--(.*-)?(foreground|fg|text)(-color)?$/i)) ??
    (isDark(background) ? "#ffffff" : "#1a1a1a");
  const font = resolve(property(root, "font-family"));
  return {
    background,
    text,
    primary:
      byName(/^--(.*-)?(primary|brand|accent)(-color)?$/i) ??
      color(themeColor) ??
      frequent ??
      "rgb(37, 186, 146)",
    font,
    headingFont: resolve(property(h1, "font-family")) ?? font,
    // the web fonts come along, their urls made absolute
    fontFaces: sheets.flatMap(({ css, base }) =>
      [...css.matchAll(/@font-face\s*\{[^}]*\}/gi)].map(([face]) =>
        face.replaceAll(
          /url\(\s*(['"]?)([^'")]+)\1\s*\)/g,
          (_, q, u) => `url(${q}${new URL(u, base).href}${q})`,
        ),
      ),
    ),
    googleFonts: [
      ...html.matchAll(
        /<link[^>]+href=["'](https:\/\/fonts\.googleapis\.com\/css[^"']+)/gi,
      ),
    ].map(([, href]) => href.replaceAll("&amp;", "&")),
    // an image mentioning "logo", else an icon big enough to be seen
    logo:
      attr(
        tags(html, "img").find((t) => /logo/i.test(t)),
        "src",
      ) ??
      attr(
        tags(html, "link").find(
          (t) => /rel=["']?icon/i.test(t) && /svg/i.test(t),
        ),
        "href",
      ) ??
      attr(
        tags(html, "link").find((t) => /rel=["']?apple-touch-icon/i.test(t)),
        "href",
      ),
  };
};

export const themeCSS = (d: ReturnType<typeof extractDesign>, logo?: string) =>
  [
    ...d.googleFonts.map((href) => `@import url("${href}");`),
    ...d.fontFaces,
    `:root {
  --sd-background-color: ${d.background};
  --sd-heading-color: var(--sd-primary-color);
  --sd-text-color: ${d.text};
  --sd-primary-color: ${d.primary};
  --sd-sv-background-color: ${d.background};
  --sd-sv-text-color: ${d.text};
}`,
    d.font && `.sd-app {\n  font-family: ${d.font};\n}`,
    d.headingFont &&
      `.sd-slide :is(h1, h2, h3) {\n  font-family: ${d.headingFont};\n}`,
    "a,\nstrong {\n  color: var(--sd-primary-color);\n}",
    logo &&
      `/* the logo of the website, as a watermark */
.sd-slide::after {
  content: "";
  position: absolute;
  right: 2vw;
  bottom: 2vw;
  width: 12vw;
  height: 6vw;
  background: url("${logo}") no-repeat right bottom / contain;
  opacity: 0.15;
  pointer-events: none;
}`,
  ]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");

export const text = async (url: string, init?: RequestInit) => {
  const response = await hubFetch(url, init);
  if (!response.ok)
    throw new CliError(`Cannot download ${url} (${response.status})`);
  return response.text();
};

// Google Fonts only serves woff2 files to the browsers it knows
export const BROWSER = {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  },
};

/** Inlines the Google Fonts stylesheets, keeping as an import the ones that cannot be read. */
const inlineGoogleFonts = async (design: ReturnType<typeof extractDesign>) => {
  const sheets = await Promise.all(
    design.googleFonts.map((href) =>
      text(href, BROWSER).then(
        (css) => ({ href, css }),
        () => ({ href, css: undefined }),
      ),
    ),
  );
  design.googleFonts = sheets.filter((s) => !s.css).map((s) => s.href);
  design.fontFaces.unshift(
    ...sheets.flatMap((s) => s.css?.match(/@font-face\s*\{[^}]*\}/gi) ?? []),
  );
};

/** Downloads the files the css loads from the web into `dir/fonts`, pointing the css at them. */
export const localize = async (css: string, dir: string) => {
  const urls = new Set(
    [...css.matchAll(/url\(\s*['"]?(https?:\/\/[^'")]+)/g)].map(([, u]) => u),
  );
  const files = new Map<string, string>();
  const used = new Set<string>();
  await Promise.all(
    [...urls].map(async (u, i) => {
      const base = new URL(u).pathname.split("/").at(-1) || "font";
      const name = `fonts/${used.has(base) ? `${i}-${base}` : base}`;
      used.add(base);
      // a file that cannot be downloaded stays loaded from the web
      const response = await hubFetch(u).catch(() => undefined);
      if (!response?.ok) return;
      await Bun.write(`${dir}/${name}`, response);
      files.set(u, name);
    }),
  );
  return css.replaceAll(
    /url\(\s*(['"]?)(https?:\/\/[^'")]+)\1\s*\)/g,
    (all, q, u) => (files.has(u) ? `url(${q}${files.get(u)}${q})` : all),
  );
};

/** Downloads the logo next to the theme, returning its file name; a logo that cannot be had is left out. */
const saveLogo = async (src: string | undefined, page: URL, dir: string) => {
  if (!src) return;
  try {
    const url = new URL(src, page);
    const response = await hubFetch(url.href);
    if (!response.ok) return;
    const ext =
      /\.(svg|png|jpe?g|webp|gif|ico)$/i.exec(url.pathname)?.[1] ??
      (response.headers.get("content-type")?.includes("svg") ? "svg" : "png");
    const logo = `logo.${ext.toLowerCase()}`;
    await Bun.write(`${dir}/${logo}`, response);
    return logo;
  } catch {
    return;
  }
};

const designCmd = new Clipse("design", "create a theme from a website");
designCmd
  .addArguments([{ name: "url", description: "website to take the look of" }])
  .addOptions({
    name: {
      short: "n",
      type: "string",
      description: "theme name (default: the host name of the website)",
      default: "",
      optional: true,
    },
    force: {
      short: "f",
      type: "boolean",
      description: "overwrite an existing theme",
      default: false,
      optional: true,
    },
    local: {
      short: "l",
      type: "boolean",
      description:
        "download the fonts into the theme rather than load them from the web",
      default: false,
      optional: true,
    },
  })
  .action(async (args, options) => {
    let url: URL;
    try {
      url = new URL(args.url ?? "");
    } catch {
      throw new CliError("Please provide the URL of a website");
    }
    const name = slugify(options.name || url.hostname.replaceAll(".", "-"));
    const file = `themes/${name}/theme.css`;
    if (existsSync(file) && !options.force)
      throw new CliError(`${file} already exists, use --force to overwrite it`);
    const html = await text(url.href);
    const links = tags(html, "link").filter((tag) =>
      /rel=["']?stylesheet/i.test(tag),
    );
    const sheets: Sheet[] = [
      ...[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(
        ([, css]) => ({ css, base: url.href }),
      ),
      ...(await Promise.all(
        links
          .map((tag) => attr(tag, "href"))
          .filter((href): href is string => !!href)
          .map((href) => new URL(href, url).href)
          // google fonts are imported as they are rather than read
          .filter((href) => !href.startsWith("https://fonts.googleapis.com/"))
          .slice(0, MAX_STYLESHEETS)
          // a stylesheet that cannot be read only leaves its rules out
          .map(async (base) => ({
            css: await text(base).catch(() => ""),
            base,
          })),
      )),
    ];
    const design = extractDesign(html, sheets);
    const dir = `themes/${name}`;
    const logo = await saveLogo(design.logo, url, dir);
    if (options.local) await inlineGoogleFonts(design);
    const css = themeCSS(design, logo);
    await Bun.write(file, options.local ? await localize(css, dir) : css);
    const { log } = console;
    log(`theme ${name} created in ${file}`);
  });

export default designCmd;
