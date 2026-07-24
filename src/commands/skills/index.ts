import { Clipse } from "clipse";

const skillsCmd = new Clipse(
  "skills",
  "add AI skills for your presentations",
);
skillsCmd
  .action(async () => {
    const slideskSkill = await (await fetch("https://raw.githubusercontent.com/slidesk/slidesk/refs/heads/main/SKILL.md")).text();
    const slideskLinkSkill = await (await fetch("https://raw.githubusercontent.com/slidesk/slidesk.link/refs/heads/main/mcp/SKILL.md")).text();
    await Bun.write(".claude/skills/slidesk.md", slideskSkill);
    await Bun.write(".claude/skills/slidesk.link.md", slideskLinkSkill);
    const { log } = console;
    log("skills added successfully")
    process.exit(0);
  });

export default skillsCmd;
