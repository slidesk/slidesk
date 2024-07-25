import { existsSync, readdirSync, readFileSync } from "node:fs";

const parsePluginDir = async () => {
  const pluginsJSON: object = {};
  const pluginsDir = "./plugins";
  if (existsSync(pluginsDir)) {
    await Promise.all(
      readdirSync(pluginsDir).map(async (plugin: string) => {
        const pluginPath = `${pluginsDir}/${plugin}/plugin.json`;
        const pluginFile = Bun.file(pluginPath);
        const exists = await pluginFile.exists();
        if (exists) {
          const json = await pluginFile.json();
          pluginsJSON[plugin] = {};
          ["addHTML", "onSlideChange", "onSpeakerViewSlideChange"].map((t) => {
            if (json[t]) {
              pluginsJSON[plugin][t] = json[t];
            }
            return true;
          });
          [
            "addScripts",
            "addSpeakerScripts",
            "addStyles",
            "addSpeakerStyles",
          ].map(async (t) => {
            if (json[t]) {
              pluginsJSON[plugin][t] = {};
              await Promise.all(
                json[t].map((s: string) => {
                  pluginsJSON[plugin][t][s] = readFileSync(s, {
                    encoding: "utf8",
                  });
                }),
              );
            }
            return true;
          });
        }
      }),
    );
  } else {
    console.log("no plugin found");
  }
  return pluginsJSON;
};

Bun.write("src/plugins.json", JSON.stringify(await parsePluginDir()));
