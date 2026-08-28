import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import getPlugins from "./getPlugins";

const talk = join(import.meta.dir, "../../__fixtures__/plugins-talk");
const pluginsDir = join(talk, "plugins");

const load = () => getPlugins(pluginsDir, talk);

describe("getPlugins", () => {
  it("returns an empty list when no plugin declares a hook", async () => {
    const empty = join(talk, "empty-plugins");
    expect(await getPlugins(empty, talk)).toEqual([]);
  });

  it("keeps only the plugins declaring addRoutes or addWS", async () => {
    const plugins = await load();
    expect(plugins.map((p) => p.name).sort()).toEqual([
      "with-both",
      "with-routes",
      "with-ws",
    ]);
  });

  const pluginNamed = async (name: string) => {
    const plugin = (await load()).find((p) => p.name === name);
    if (plugin === undefined) throw new Error(`plugin ${name} was not loaded`);
    return plugin;
  };

  it("loads the addRoutes handler", async () => {
    const plugin = await pluginNamed("with-routes");
    expect(typeof plugin.addRoutes).toBe("function");
    expect((plugin.addRoutes as () => string)()).toBe("routed");
  });

  it("loads the addWS handler", async () => {
    const plugin = await pluginNamed("with-ws");
    expect((plugin.addWS as () => string)()).toBe("socketed");
  });

  it("loads both handlers when both are declared", async () => {
    const plugin = await pluginNamed("with-both");
    expect((plugin.addRoutes as () => string)()).toBe("both-routes");
    expect((plugin.addWS as () => string)()).toBe("both-ws");
  });
});
