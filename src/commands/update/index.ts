import { Clipse } from "clipse";
import {
  type AddonKind,
  addonInstall,
  installedAddons,
} from "../../utils/addon";
import { CliError } from "../../utils/cliError";

const { log, error } = console;

const KINDS: AddonKind[] = ["plugin", "component", "theme", "template"];

const updateCmd = new Clipse(
  "update",
  "update the addons installed from slidesk.link",
);
updateCmd
  .addGlobalOptions({
    "slidesk-link-url": { type: "string", default: "https://slidesk.link" },
  })
  .addArguments([
    {
      name: "kind",
      description: "plugins, components, themes or templates (all if omitted)",
    },
  ])
  .action(async (args, opts: { "slidesk-link-url"?: string }) => {
    // "plugins" or "plugin"
    const asked = args.kind?.replace(/s$/, "");
    if (asked && !KINDS.includes(asked as AddonKind))
      throw new CliError(
        `${args.kind} is not plugins, components, themes or templates`,
      );
    const kinds = asked ? [asked as AddonKind] : KINDS;
    let failed = 0;
    let updated = 0;
    for (const kind of kinds)
      for (const name of installedAddons(kind)) {
        // one at a time: a failing addon does not stop the others
        try {
          log(await addonInstall(kind, name, opts["slidesk-link-url"], true)); // NOSONAR
          updated += 1;
        } catch (e) {
          failed += 1;
          error(e instanceof Error ? e.message : e);
        }
      }
    if (failed) throw new CliError(`${failed} addon(s) could not be updated`);
    if (!updated) log("nothing to update");
  });

export default updateCmd;
