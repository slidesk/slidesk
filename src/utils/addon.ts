import { rm } from "node:fs/promises";
import { multiselect } from "@clack/prompts";
import { type AnyClipse, Clipse } from "clipse";
import { extract } from "tar";
import { CliError } from "./cliError";

const { log } = console;

export type AddonKind = "plugin" | "template" | "component" | "theme";
type LinkOpts = { "slidesk-link-url"?: string };

// a hub name is `user__addon`, an installed one a single path segment
const HUB_NAME = /^@?[\w-][\w.-]*__[\w-][\w.-]*$/;
const LOCAL_NAME = /^@?[\w-][\w.-]*$/;

/** Downloads `user/addon` (or `user__addon`) from slidesk.link, replacing any installed version. */
export const addonInstall = async (
  kind: AddonKind,
  name: string,
  urlLink = "https://slidesk.link",
  update = false,
  target = process.cwd(),
) => {
  const addonName = name.replace("/", "__").replaceAll(/\\u[\da-fA-F]{4}/g, "");
  if (!HUB_NAME.test(addonName))
    throw new CliError(`Please provide a ${kind} name like user/${kind}`);
  const [user, ...rest] = addonName.split("__");
  const addon = rest.join("__");
  const label = `${user}/${addon}`;
  const response = await fetch(
    `${urlLink}/addons/download/${kind}/${user.replace("@", "")}/${addon}`,
  );
  if (response.status === 404) throw new CliError(`${kind} ${label} not found`);
  if (!response.ok)
    throw new CliError(
      `${kind} ${label} could not be downloaded (${response.status})`,
    );
  const tarball = await response.blob();
  // the installed version is only dropped once the new one is downloaded
  const dir =
    kind === "component"
      ? `${target}/components`
      : `${target}/${kind}s/${addonName}`;
  if (kind !== "component") await rm(dir, { recursive: true, force: true });
  const tmp = `${dir}/link.tgz`;
  await Bun.write(tmp, tarball);
  // plugins, themes and templates are packed inside a directory named after them
  await extract({ file: tmp, C: dir, strip: kind === "component" ? 0 : 1 });
  await rm(tmp);
  if (kind === "plugin") {
    const manifest = Bun.file(`${dir}/plugin.json`);
    await Bun.write(
      manifest,
      (await manifest.text()).replaceAll(
        `plugins/${addon}/`,
        `plugins/${addonName}/`,
      ),
    );
  }
  return `${kind} ${label} ${update ? "updated" : "installed"}`;
};

export const addonRemove = async (kind: AddonKind, name: string) => {
  if (!LOCAL_NAME.test(name))
    throw new CliError(`Please provide the name of an installed ${kind}`);
  const path =
    kind === "component" ? `components/${name}.mjs` : `${kind}s/${name}`;
  const marker = kind === "component" ? path : `${path}/${kind}.json`;
  if (!(await Bun.file(marker).exists()))
    throw new CliError(`${kind} ${name} not found`);
  await rm(path, { recursive: true, force: true });
  return `${kind} ${name} removed`;
};

const searchCmd = (kind: AddonKind) =>
  new Clipse("search", `slidesk ${kind} search`)
    .addArguments([
      { name: "search", description: "term to find in name or tags" },
    ])
    .action(async (args, opts: LinkOpts) => {
      if (!args.search) throw new CliError("Please provide a search term");
      const response = await fetch(
        `${opts["slidesk-link-url"]}/addons/search/${kind}/${args.search}`,
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
        for (const p of selection)
          log(await addonInstall(kind, p, opts["slidesk-link-url"]));
    });

/** The `slidesk <kind>` command: install, remove, update and search on slidesk.link, plus its own push. */
export const addonCmd = (kind: AddonKind, pushCmd: AnyClipse) => {
  const nameArg = [{ name: "name", description: `name of the ${kind}` }];
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
      pushCmd,
    ]);
};
