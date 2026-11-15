import type { Page } from "../browser";

const SETTLE = 100;
// a slide whose look keeps changing on its own must not be unrolled forever
const MAX_STEPS = 50;

// what the speaker sees: the current slide, and which of its elements show
const LOOK = `(() => {
  const s = window.slidesk;
  const slide = s.slides[s.currentSlide];
  return s.currentSlide + ":" + [...slide.querySelectorAll("*")]
    .map((e) => {
      const c = getComputedStyle(e);
      return c.opacity + c.visibility + c.display;
    })
    .join();
})()`;

// press "next" like a speaker would, so plugin onSlideChange hooks run and a
// step plugin (steps, sbs) reveals its items one at a time: each state, a new
// slide or a newly revealed item, is reported as (slide index, step)
const walk = async (
  page: Page,
  total: number,
  transition: number,
  onState?: (slide: number, step: number) => Promise<void> | void,
) => {
  if (!total) return;
  const settle = () => Bun.sleep(transition + SETTLE);
  // step plugins only hide their items when the slide is reached with "next"
  const go = (n: number) =>
    page.evaluate(
      `(window.slidesk.lastAction = "next", window.slidesk.goto(${n}))`,
    );
  await go(0);
  await settle();
  let slide = 0;
  let step = 0;
  let look = await page.evaluate<string>(LOOK);
  await onState?.(slide, step);
  // sequential on purpose: the page shows one state at a time
  for (;;) {
    if (step + 1 >= MAX_STEPS) {
      if (slide + 1 >= total) return;
      await go(slide + 1); // NOSONAR
    } else await page.evaluate("window.slidesk.next()"); // NOSONAR
    await settle(); // NOSONAR
    const next = await page.evaluate<string>(LOOK); // NOSONAR
    // nothing changed: the last slide, fully revealed
    if (next === look) return;
    look = next;
    const current = Number(next.slice(0, next.indexOf(":")));
    if (current === slide) step += 1;
    else {
      slide = current;
      step = 0;
    }
    await onState?.(slide, step); // NOSONAR
  }
};

export default walk;
