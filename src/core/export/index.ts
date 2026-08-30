import path from "node:path";
import type { SliDeskExportOptions } from "../../types";
import convert from "../../utils/convert";
import loadEnv from "../../utils/loadEnv";
import progress from "../../utils/progress";
import slugify from "../../utils/slugify";
import launch from "../browser";
import pdf from "./pdf";
import pptx from "./pptx";
import prepare from "./prepare";
import serve from "./serve";

const { log } = console;

const WIDTH = 1920;
const HEIGHT = 1080;

const defaultOutput = (talkdir: string, env: Record<string, unknown>) => {
  const title = (env.slidesk as Record<string, unknown>)?.TITLE as string;
  const name = slugify(
    (title ?? path.basename(talkdir))
      .normalize("NFD")
      .replaceAll(/\p{M}/gu, ""),
  );
  return name === "" ? "presentation" : name;
};

const exportTalk = async (talkdir: string, options: SliDeskExportOptions) => {
  const type = options.type ?? "pdf";
  const env = await loadEnv(talkdir, options);
  const slideskEnv = (env.slidesk ?? {}) as Record<string, unknown>;
  const files = await convert(talkdir, options, env);
  const target =
    options.output && options.output !== ""
      ? options.output
      : `${defaultOutput(talkdir, env)}.${type}`;

  const server = await serve(files, env, talkdir);
  const page = await launch(WIDTH, HEIGHT);
  let bar: ReturnType<typeof progress> | null = null;
  try {
    await page.goto(server.url);
    const total = await prepare(page, WIDTH, HEIGHT);
    log(`📽️  ${total} slide${total > 1 ? "s" : ""} to export`);
    const transition = Number(slideskEnv.TRANSITION ?? 300);
    bar = progress(total);
    const onSlide = (num: number) => bar?.update(num);
    const data =
      type === "pptx"
        ? await pptx(
            page,
            total,
            WIDTH,
            HEIGHT,
            (slideskEnv.TITLE as string) ?? "SliDesk presentation",
            transition,
            onSlide,
          )
        : await pdf(page, total, WIDTH, HEIGHT, transition, onSlide);
    bar.stop();
    await Bun.write(target, data);
    log(`✅ ${target}`);
  } finally {
    bar?.stop();
    await page.close();
    server.stop();
  }
};

export default exportTalk;
