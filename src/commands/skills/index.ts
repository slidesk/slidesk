import { Clipse } from "clipse";
import { CliError } from "../../utils/cliError";
import { hubFetch } from "../../utils/hub";

// Claude Code loads a skill from .claude/skills/<its name>/SKILL.md
const SKILLS = {
  slidesk:
    "https://raw.githubusercontent.com/slidesk/slidesk/refs/heads/main/SKILL.md",
  "slidesk-addons":
    "https://raw.githubusercontent.com/slidesk/slidesk.link/refs/heads/main/mcp/SKILL.md",
};

const skillsCmd = new Clipse("skills", "add AI skills for your presentations");
skillsCmd.action(async () => {
  for (const [name, url] of Object.entries(SKILLS)) {
    const response = await hubFetch(url);
    if (!response.ok)
      throw new CliError(
        `Cannot download the ${name} skill (${response.status})`,
      );
    await Bun.write(`.claude/skills/${name}/SKILL.md`, await response.text());
  }
  const { log } = console;
  log("skills added successfully");
});

export default skillsCmd;
