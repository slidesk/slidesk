import { Clipse } from "clipse";
import { homedir } from "node:os";
import start from "../../utils/start";

const linkLoginCmd = new Clipse("login", "login to slidesk.link")
  .addOptions({
    force: {
      type: "boolean",
      default: false,
      description: "force token refresh",
    },
  })
  .action(async (_, o) => {
    const home = homedir();
    const globalSlidesk = Bun.file(`${home}/.slidesk`);
    if (
      (await globalSlidesk.exists()) &&
      globalSlidesk.size !== 0 &&
      !o.force
    ) {
      process.exit(0);
    }
    Bun.serve({
      port: 1337,
      routes: {
        "/auth/:code": async (req) => {
          const { code } = req.params;
          await Bun.write(globalSlidesk, code);
          return new Response(
            `<html>
              <script>
                fetch("http://localhost:1337/close").then(() => {
                  window.close();
                })
              </script>
              <body>You can close this tab</body>
            </html>`,
            { headers: { "Content-Type": "text/html" } },
          );
        },
        "/close": () => {
          process.exit(0);
        },
      },
    });
    Bun.spawn([start, "https://slidesk.link/auth"]);
  });

export default linkLoginCmd;
