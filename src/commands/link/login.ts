import { homedir } from "node:os";
import { Clipse } from "clipse";
import { saveLinkToken } from "../../utils/getLinkToken";
import start from "../../utils/start";

const linkLoginCmd = new Clipse("login", "login to slidesk.link")
  .addOptions({
    force: {
      type: "boolean",
      default: false,
      description: "force token refresh",
    },
    "with-token": {
      type: "string",
      default: "",
      description: "token to use, you can fetch it into your profile page",
      optional: true,
    },
  })
  .action(
    async (
      _,
      o: {
        force?: boolean;
        "with-token"?: string;
        "slidesk-link-url"?: string;
      },
    ) => {
      const home = homedir();
      const globalSlidesk = Bun.file(`${home}/.slidesk`);
      if (
        (await globalSlidesk.exists()) &&
        globalSlidesk.size !== 0 &&
        !o.force
      )
        return;
      if (o["with-token"]) {
        await saveLinkToken(String(o["with-token"]));
        return;
      }
      const routes = {
        "/auth/:code": async (req: Bun.BunRequest<"/auth/:code">) => {
          const { code } = req.params;
          await saveLinkToken(code);
          return new Response(
            `<html>
              <script>
                fetch("/close").then(() => {
                  window.close();
                })
              </script>
              <body>You can close this tab</body>
            </html>`,
            { headers: { "Content-Type": "text/html" } },
          );
        },
        // nothing else keeps the process alive once the server is stopped
        "/close": () => {
          // the response goes out while the server winds down
          void server.stop();
          return new Response();
        },
      };
      let server: ReturnType<typeof Bun.serve>;
      try {
        // the port older hubs redirect to
        server = Bun.serve({ port: 1337, routes });
      } catch {
        // taken, for instance by a running presentation
        server = Bun.serve({ port: 0, routes });
      }
      Bun.spawn([start(), `${o["slidesk-link-url"]}/auth?port=${server.port}`]);
    },
  );

export default linkLoginCmd;
