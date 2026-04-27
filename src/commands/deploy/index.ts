import { Clipse } from "clipse";
import gitlabYML from "../../templates/ci/gitlab-ci.yml" with { type: "text" };
import githubYML from "../../templates/ci/github.yml" with { type: "text" };
import linkYML from "../../templates/ci/link.yml" with { type: "text" };

const { error } = console;

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
  })
  .action(async (args, options) => {
    const talkdir = `${process.cwd()}/${args.talk ?? ""}`;
    const depls = ["github", "gitlab", "link"];
    if (!depls.includes(options.target as string)) {
      error(
        `${options.target} is not a valid deploy option (${depls.join(", ")})`,
      );
      process.exit(1);
    } else {
      switch (options.target) {
        case "github":
          await Bun.write(
            `${talkdir}/.github/workflows/slidesk.yml`,
            githubYML,
          );
          break;
        case "gitlab":
          await Bun.write(`${talkdir}/.gitlab-ci.yml`, gitlabYML);
          break;
        case "link":
          await Bun.write(`${talkdir}/link.yml`, linkYML);
          break;
      }
      process.exit(0);
    }
  });

export default deployCmd;
