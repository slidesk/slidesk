import { existsSync, readdirSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { basename } from "node:path";
import { multiselect } from "@clack/prompts";
import { Clipse } from "clipse";
import { extract } from "tar";
import { CliError } from "./cliError";
import getLinkToken from "./getLinkToken";
import { hubFetch, withTarball } from "./hub";
import slugify from "./slugify";

const { log } = console;

export type AddonKind = "plugin" | "template" | "component" | "theme";
type LinkOpts = { "slidesk-link-url"?: string };

// a hub name is `user__addon`, an installed one a single path segment
const LOCAL_NAME = /^@?[\w-][\w.-]*$/;
const SEGMENT = /^[\w-][\w.-]*$/;
export const isHubName = (name: string) => {
  const [user, ...addon] = name.split("__");
  return (
    addon.length > 0 && LOCAL_NAME.test(user) && SEGMENT.test(addon.join("__"))
  );
};

/**
 * Moves the addon unpacked in `src` to its place in the talk, replacing any
 * installed version: `components/<name>.mjs` for a component, whose `.mjs`
 * may sit anywhere in `src`, and `<kind>s/<name>/` for the others.
 */
const placeAddon = async (
  kind: AddonKind,
  src: string,
  target: string,
  name: string,
) => {
  if (kind !== "component") {
    const dir = `${target}/${kind}s/${name}`;
    await rm(dir, { recursive: true, force: true });
    await rename(src, dir);
    return;
  }
  const [file] = await Array.fromAsync(new Bun.Glob("**/*.mjs").scan(src));
  if (!file) throw new CliError(`component ${name} holds no .mjs file`);
  await rename(`${src}/${file}`, `${target}/components/${name}.mjs`);
};

// https://, ssh:// or scp-like git@host:path; never an option or a local path
const GIT_URL = /^(https:\/\/|ssh:\/\/|git@)[\w.@:/~+-]+$/;
export const isGitUrl = (name: string) => GIT_URL.test(name);

/** Runs git, and turns its failure into a CliError starting with `failure`. */
const git = async (args: string[], failure: string) => {
  const proc = Bun.spawn(["git", ...args], {
    stdin: "inherit",
    stdout: "ignore",
    stderr: "pipe",
  });
  if (await proc.exited)
    throw new CliError(
      `${failure}: ${(await new Response(proc.stderr).text()).trim()}`,
    );
};

/** Force-pulls an addon installed from git: its local changes are dropped. */
const gitPull = async (kind: AddonKind, name: string, dir: string) => {
  const failure = `${kind} ${name} could not be updated`;
  await git(["-C", dir, "fetch", "--quiet", "--depth", "1"], failure);
  await git(["-C", dir, "reset", "--quiet", "--hard", "FETCH_HEAD"], failure);
  return `${kind} ${name} updated`;
};

/** Clones the git repository at `url` and installs the addon it holds. */
const gitInstall = async (
  kind: AddonKind,
  url: string,
  update: boolean,
  target: string,
) => {
  let name = basename(url).replace(/\.git$/, "");
  if (!SEGMENT.test(name)) throw new CliError(`${url} is not an addon name`);
  const tmp = `${target}/${kind}s/.${name}.git`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(`${target}/${kind}s`, { recursive: true });
  try {
    await git(
      ["clone", "--depth", "1", "--quiet", "--", url, tmp],
      `${url} could not be cloned`,
    );
    // kept so that an update force-pulls it, except in a single-file component
    if (kind === "component")
      await rm(`${tmp}/.git`, { recursive: true, force: true });
    else {
      const manifest = Bun.file(`${tmp}/${kind}.json`);
      if (!(await manifest.exists()))
        throw new CliError(`${url} holds no ${kind}.json: it is not a ${kind}`);
      // its files are listed as plugins/<name>/…: it is installed under that name
      if (kind === "plugin")
        name = /plugins\/([\w.-]+)\//.exec(await manifest.text())?.[1] ?? name;
    }
    await placeAddon(kind, tmp, target, name);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  return `${kind} ${name} ${update ? "updated" : "installed"} from ${url}`;
};

/**
 * Downloads `user/addon` (or `user__addon`) from slidesk.link, or clones a git
 * repository, replacing any installed version.
 */
export const addonInstall = async (
  kind: AddonKind,
  name: string,
  urlLink = "https://slidesk.link",
  update = false,
  target = process.cwd(),
) => {
  if (isGitUrl(name)) return gitInstall(kind, name, update, target);
  const gitDir = `${target}/${kind}s/${name}`;
  if (SEGMENT.test(name) && existsSync(`${gitDir}/.git`))
    return gitPull(kind, name, gitDir);
  const addonName = name.replace("/", "__").replaceAll(/\\u[\da-fA-F]{4}/g, "");
  if (!isHubName(addonName))
    throw new CliError(`Please provide a ${kind} name like user/${kind}`);
  const [user, ...rest] = addonName.split("__");
  const addon = rest.join("__");
  const label = `${user}/${addon}`;
  const response = await hubFetch(
    `${urlLink}/addons/download/${kind}/${user.replace("@", "")}/${addon}`,
  );
  if (response.status === 404) throw new CliError(`${kind} ${label} not found`);
  if (!response.ok)
    throw new CliError(
      `${kind} ${label} could not be downloaded (${response.status})`,
    );
  // unpacked aside first: the installed version is only replaced by a
  // complete new one
  const tmp = `${target}/${kind}s/.${addonName}`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(`${tmp}/addon`, { recursive: true });
  try {
    await Bun.write(`${tmp}/link.tgz`, await response.blob());
    // plugins, themes and templates are packed inside a directory named after
    // them, a component's .mjs anywhere
    await extract({
      file: `${tmp}/link.tgz`,
      C: `${tmp}/addon`,
      strip: kind === "component" ? 0 : 1,
    });
    if (kind === "plugin") {
      const manifest = Bun.file(`${tmp}/addon/plugin.json`);
      await Bun.write(
        manifest,
        (await manifest.text()).replaceAll(
          `plugins/${addon}/`,
          `plugins/${addonName}/`,
        ),
      );
    }
    await placeAddon(kind, `${tmp}/addon`, target, addonName);
    // the same component installed before its author was kept would run twice
    if (kind === "component")
      await rm(`${target}/components/${addon}.mjs`, { force: true });
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  return `${kind} ${label} ${update ? "updated" : "installed"}`;
};

export const addonRemove = async (kind: AddonKind, name: string) => {
  if (!LOCAL_NAME.test(name))
    throw new CliError(`Please provide the name of an installed ${kind}`);
  // a component is `user__name.mjs`, or a bare `name.mjs` when installed
  // before its author was kept
  const path =
    kind === "component"
      ? ([
          `components/${name}.mjs`,
          `components/${name.split("__").at(-1)}.mjs`,
        ].find(existsSync) ?? `components/${name}.mjs`)
      : `${kind}s/${name}`;
  const marker = kind === "component" ? path : `${path}/${kind}.json`;
  if (!(await Bun.file(marker).exists()))
    throw new CliError(`${kind} ${name} not found`);
  await rm(path, { recursive: true, force: true });
  return `${kind} ${name} removed`;
};

/** The addons of `kind` installed from slidesk.link, named `user__addon`, or from git. */
export const installedAddons = (kind: AddonKind, target = process.cwd()) => {
  const dir = `${target}/${kind}s`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) =>
      kind === "component"
        ? d.isFile() && d.name.endsWith(".mjs")
        : d.isDirectory(),
    )
    .map((d) => d.name.replace(/\.mjs$/, ""))
    .filter((name) => isHubName(name) || existsSync(`${dir}/${name}/.git`));
};

const searchCmd = (kind: AddonKind) =>
  new Clipse("search", `slidesk ${kind} search`)
    .addArguments([
      { name: "search", description: "term to find in name or tags" },
    ])
    .action(async (args, opts: LinkOpts) => {
      if (!args.search) throw new CliError("Please provide a search term");
      const response = await hubFetch(
        `${opts["slidesk-link-url"]}/addons/search/${kind}/${encodeURIComponent(args.search)}`,
      );
      if (response.status !== 200)
        throw new CliError(`No ${kind} with this name is found`);
      const list: string[] = await response.json();
      const selection = await multiselect({
        message: `Select which ${kind}s you want to install`,
        options: list.map((l) => ({ value: l, label: l })),
        required: false,
      });
      // multiselect returns a symbol when the prompt is cancelled
      if (Array.isArray(selection))
        // one at a time: components share components/link.tgz while installing
        for (const p of selection)
          log(await addonInstall(kind, p, opts["slidesk-link-url"])); // NOSONAR
    });

/** The manifest sent along an addon: plugin.json, or the preview images of a theme. */
const pushedJson = async (kind: AddonKind, path: string, name: string) => {
  if (kind === "plugin") {
    const manifest = Bun.file(`${path}/plugin.json`);
    if (!(await manifest.exists()))
      throw new CliError(`${name}/plugin.json is missing`);
    return JSON.stringify(await manifest.json());
  }
  if (kind === "theme" && existsSync(`${path}/preview`)) {
    const images: string[] = [];
    for await (const img of new Bun.Glob("*.webp").scan(`${path}/preview`))
      images.push(
        Buffer.from(
          await Bun.file(`${path}/preview/${img}`).arrayBuffer(),
        ).toString("base64"),
      );
    return JSON.stringify(images);
  }
  return kind === "theme" ? "[]" : "{}";
};

const pushCmd = (kind: AddonKind) =>
  new Clipse("push", `push ${kind} to your user page on slidesk.link`)
    .addArguments([{ name: "name", description: `${kind} name` }])
    .action(async (args, opts: LinkOpts) => {
      if (!args.name) throw new CliError(`Please provide a ${kind} name`);
      // a component is a single .mjs file, the other addons a directory
      const entry = kind === "component" ? `${args.name}.mjs` : args.name;
      const path = `${process.cwd()}/${entry}`;
      if (!existsSync(path)) throw new CliError(`${entry} not found`);
      const json = await pushedJson(kind, path, args.name);
      const readme = Bun.file(
        kind === "component" ? path : `${path}/README.md`,
      );
      const desc = (await readme.exists()) ? await readme.text() : "";
      const slideskToken = await getLinkToken();
      await withTarball(process.cwd(), [entry], async (file) => {
        const data = new FormData();
        data.set("file", file);
        data.set("type", kind);
        data.set("name", slugify(args.name ?? ""));
        data.set("json", json);
        data.set("desc", desc);
        const response = await hubFetch(`${opts["slidesk-link-url"]}/addons`, {
          method: "post",
          body: data,
          headers: { "x-slidesk": slideskToken },
        });
        if (response.status !== 201) throw new CliError(await response.text());
      });
      log(`Your ${kind} has been added or updated into the hub, thanks`);
    });

/** The `slidesk <kind>` command: install, remove, update, search and push on slidesk.link. */
export const addonCmd = (kind: AddonKind) => {
  const nameArg = [
    { name: "name", description: `name of the ${kind}, or its git repository` },
  ];
  const install =
    (update: boolean) => async (args: { name?: string }, opts: LinkOpts) =>
      log(
        await addonInstall(
          kind,
          args.name ?? "",
          opts["slidesk-link-url"],
          update,
        ),
      );
  return new Clipse(kind, `slidesk ${kind} management`)
    .addGlobalOptions({
      "slidesk-link-url": { type: "string", default: "https://slidesk.link" },
    })
    .addSubcommands([
      new Clipse("install", `slidesk ${kind} installer`)
        .addArguments(nameArg)
        .action(install(false)),
      new Clipse("remove", `slidesk ${kind} remover`)
        .addArguments(nameArg)
        .action(async (args) =>
          log(await addonRemove(kind, (args.name ?? "").replace("/", "__"))),
        ),
      new Clipse("update", `slidesk ${kind} updater`)
        .addArguments(nameArg)
        .action(install(true)),
      searchCmd(kind),
      pushCmd(kind),
    ]);
};
