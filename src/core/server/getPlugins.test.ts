import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import getPlugins from "./getPlugins";

const talk = join(import.meta.dir, "../../__fixtures__/plugins-talk");
const pluginsDir = join(talk, "plugins");

const load = () => getPlugins(pluginsDir, talk);

describe("getPlugins", () => {
  it("reloads a handler edited since the last load", async () => {
    const dir = mkdtempSync(join(tmpdir(), "slidesk-plugins-"));
    mkdirSync(join(dir, "plugins/hot"), { recursive: true });
    writeFileSync(
      join(dir, "plugins/hot/plugin.json"),
      '{"addRoutes":"plugins/hot/routes.js"}',
    );
    const handler = async () => {
      const [plugin] = await getPlugins(join(dir, "plugins"), dir);
      return (plugin.addRoutes as unknown as () => string)();
    };
    writeFileSync(join(dir, "plugins/hot/routes.js"), "export default () => 1");
    expect(await handler()).toBe(1);
    writeFileSync(join(dir, "plugins/hot/routes.js"), "export default () => 2");
    expect(await handler()).toBe(2);
    rmSync(dir, { recursive: true, force: true });
  });

  it("skips a plugin whose plugin.json or handler is not ready", async () => {
    const dir = mkdtempSync(join(tmpdir(), "slidesk-plugins-"));
    mkdirSync(join(dir, "plugins/half"), { recursive: true });
    mkdirSync(join(dir, "plugins/nohandler"), { recursive: true });
    writeFileSync(join(dir, "plugins/half/plugin.json"), '{"addWS":');
    writeFileSync(
      join(dir, "plugins/nohandler/plugin.json"),
      '{"addRoutes":"plugins/nohandler/todo.js"}',
    );
    expect(await getPlugins(join(dir, "plugins"), dir)).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });

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
    expect((plugin.addRoutes as unknown as () => string)()).toBe("routed");
  });

  it("loads the addWS handler", async () => {
    const plugin = await pluginNamed("with-ws");
    expect((plugin.addWS as unknown as () => string)()).toBe("socketed");
  });

  it("loads both handlers when both are declared", async () => {
    const plugin = await pluginNamed("with-both");
    expect((plugin.addRoutes as unknown as () => string)()).toBe("both-routes");
    expect((plugin.addWS as unknown as () => string)()).toBe("both-ws");
  });
});
