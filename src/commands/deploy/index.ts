import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Clipse } from "clipse";
import githubYML from "../../templates/ci/github.yml" with { type: "text" };
import gitlabYML from "../../templates/ci/gitlab-ci.yml" with { type: "text" };
import linkYML from "../../templates/ci/link.yml" with { type: "text" };
import { CliError } from "../../utils/cliError";
import { themeNames } from "../../utils/themes";

const deployCmd = new Clipse(
  "deploy",
  "create a deploy file for your presentation",
);
deployCmd
  .addArguments([
    { name: "talk", description: "name of your talk/directory (default: .)" },
  ])
  .addOptions({
    target: {
      short: "t",
      type: "string",
      description:
        "generate a deploy file for 'github', 'gitlab' or 'link' (slidesk.link)",
      default: "",
      optional: false,
    },
    force: {
      short: "f",
      type: "boolean",
      description: "overwrite the deploy file if it already exists",
      default: false,
      optional: true,
    },
    theme: {
      short: "T",
      type: "string",
      description: "build with only this theme, when the talk has several",
      default: "",
      optional: true,
    },
  })
  .action(async (args, options) => {
    const talkdir = resolve(args.talk ?? "");
    const files: Record<string, [string, string]> = {
      github: [".github/workflows/slidesk.yml", githubYML],
      gitlab: [".gitlab-ci.yml", gitlabYML],
      link: ["link.yml", linkYML],
    };
    if (!Object.hasOwn(files, options.target))
      throw new CliError(
        `${options.target} is not a valid deploy option (${Object.keys(files).join(", ")})`,
      );
    const [path, template] = files[options.target];
    let content = template;
    if (options.theme) {
      // the name ends up in a shell command of the CI
      if (!/^[\w.-]+$/.test(options.theme))
        throw new CliError(`${options.theme} is not a valid theme name`);
      themeNames(talkdir, options.theme);
      content = content.replaceAll(
        "slidesk save ",
        `slidesk save -T ${options.theme} `,
      );
    }
    // a .gitlab-ci.yml often drives the whole repository
    if (existsSync(`${talkdir}/${path}`) && !options.force)
      throw new CliError(`${path} already exists, use --force to replace it`);
    await Bun.write(`${talkdir}/${path}`, content);
  });

export default deployCmd;
