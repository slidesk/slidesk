import { homedir } from "node:os";
import { Clipse } from "clipse";
import { saveLinkToken } from "../../utils/getLinkToken";
import openUrl from "../../utils/openUrl";

const { log } = console;

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
      ) {
        log("You are already logged in, use --force to log in again");
        return;
      }
      if (o["with-token"]) {
        await saveLinkToken(String(o["with-token"]));
        log("You are logged in to slidesk.link");
        return;
      }
      // only the hub this login was started on knows it: another page cannot
      // log the CLI in to its own account
      const state = crypto.randomUUID();
      const routes = {
        "/auth/:code": async (req: Bun.BunRequest<"/auth/:code">) => {
          if (new URL(req.url).searchParams.get("state") !== state)
            return new Response("This login was not started here", {
              status: 403,
            });
          const { code } = req.params;
          await saveLinkToken(code);
          log("You are logged in to slidesk.link");
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
      const url = `${o["slidesk-link-url"]}/auth?port=${server.port}&state=${state}`;
      log(`Log in from your browser: ${url}`);
      openUrl(url);
    },
  );

export default linkLoginCmd;
